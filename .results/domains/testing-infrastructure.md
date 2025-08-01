# Testing Infrastructure Domain

## Overview
Comprehensive testing system with fixture-based testing, snapshot testing, and mock Figma API simulation. This domain provides the foundation for reliable testing of the design token extraction and transformation pipeline.

## Core Architecture

### Test Data Creation (`src/utils/test.utils.ts`)
```typescript
export function createTestData(figmaData: any) {
  return {
    setupTest: async () => {
      // Create mock Figma API
      const mockFigma = createMockFigmaAPI(figmaData);
      
      // Set up global test environment
      global.figma = mockFigma;
      
      return {
        figma: mockFigma,
        cleanup: () => {
          delete global.figma;
        }
      };
    }
  };
}

// Serialize Figma data for test fixtures
export async function serializeFigmaData(node: BaseNode): Promise<any> {
  const excludedProps = new Set([
    'inferredVariables',
    'availableInferredVariables',
    // Properties that can't be serialized or aren't needed for tests
  ]);

  const baseData: any = {};

  // Serialize all enumerable properties
  for (const key in node) {
    try {
      if (excludedProps.has(key)) continue;
      
      const value = (node as any)[key];
      if (typeof value === 'function' || value === undefined) continue;
      
      baseData[key] = value;
    } catch (error) {
      // Some properties throw when accessed, skip those
      continue;
    }
  }

  // Recursively process children
  if ('children' in node) {
    baseData.children = await Promise.all(
      node.children.map(child => serializeFigmaData(child))
    );
  }

  // Handle variable collections and references
  const variables: Record<string, any> = {};
  
  async function collectVariableAndAliases(variableId: string, variables: Record<string, any>) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) return;

    variables[variableId] = {
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      valuesByMode: variable.valuesByMode,
    };

    // Check for aliases in all modes
    for (const modeId in variable.valuesByMode) {
      const value = variable.valuesByMode[modeId];
      if (isVariableAlias(value)) {
        await collectVariableAndAliases(value.id, variables);
      }
    }
  }

  // Collect all variables used by this node
  if ('boundVariables' in baseData && baseData.boundVariables) {
    for (const binding of Object.values(baseData.boundVariables) as any) {
      if (Array.isArray(binding)) {
        for (const alias of binding) {
          if (isVariableAlias(alias)) {
            await collectVariableAndAliases(alias.id, variables);
          }
        }
      } else if (isVariableAlias(binding)) {
        await collectVariableAndAliases(binding.id, variables);
      }
    }
  }

  return {
    ...baseData,
    variables: Object.keys(variables).length > 0 ? variables : undefined
  };
}
```

### Mock Figma API Creation
```typescript
function createMockFigmaAPI(testData: any): PluginAPI {
  // Create mock page structure
  const mockPage = createMockNode(testData, null);
  
  const mockFigma: Partial<PluginAPI> = {
    root: {
      children: [mockPage],
      // ... other root properties
    },
    currentPage: mockPage,
    
    // Mock async page loading
    loadAllPagesAsync: jest.fn().mockResolvedValue(undefined),
    
    // Mock variable system
    variables: {
      getVariableByIdAsync: jest.fn((id: string) => {
        const variable = testData.variables?.[id];
        return Promise.resolve(variable || null);
      }),
      getVariableCollectionByIdAsync: jest.fn().mockResolvedValue(null),
    },
    
    // Mock node operations
    getNodeByIdAsync: jest.fn((id: string) => {
      const node = findNodeById(mockPage, id);
      return Promise.resolve(node);
    }),
    
    // Mock UI and storage APIs
    ui: {
      postMessage: jest.fn(),
      onmessage: null
    },
    clientStorage: {
      getAsync: jest.fn().mockResolvedValue('{}'),
      setAsync: jest.fn().mockResolvedValue(undefined),
    }
  };
  
  return mockFigma as PluginAPI;
}
```

### Mock Node Creation
```typescript
function createMockNode(nodeData: any, parent: BaseNode | null): BaseNode {
  const node = {
    ...nodeData,
    parent,
    // Add required methods for BaseNode
    remove: jest.fn(),
    setRelaunchData: jest.fn(),
    getRelaunchData: jest.fn().mockReturnValue({}),
  };
  
  // Recursively create children
  if (nodeData.children) {
    node.children = nodeData.children.map((childData: any) => 
      createMockNode(childData, node)
    );
  }
  
  // Add type-specific mock methods
  switch (nodeData.type) {
    case 'TEXT':
      Object.assign(node, createTextNodeMethods());
      break;
    case 'FRAME':
      Object.assign(node, createFrameNodeMethods());
      break;
    case 'COMPONENT':
      Object.assign(node, createComponentNodeMethods());
      break;
    case 'COMPONENT_SET':
      Object.assign(node, createComponentSetNodeMethods());
      break;
  }
  
  return node as BaseNode;
}

// Type-specific mock methods
function createTextNodeMethods() {
  return {
    // Text-specific methods
    getRange: jest.fn(),
    insertCharacters: jest.fn(),
    deleteCharacters: jest.fn(),
  };
}

function createFrameNodeMethods() {
  return {
    // Frame-specific methods
    appendChild: jest.fn(),
    insertChild: jest.fn(),
    removeChild: jest.fn(),
  };
}
```

## Test Structure and Organization

### Test File Pattern
```typescript
// Example: background-processors.test.ts
import { collectTokens } from '../../services';
import { transformToCss, transformToScss } from '../../transformers';
import testData from '../fixtures/figma-test-data_background.json';
import { createTestData } from '../../utils/test.utils';

describe('Background Processors', () => {
  it('should process background solid correctly', async () => {
    // Setup test environment
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();
    global.figma = testSetup.figma;

    // Execute test pipeline
    const tokens = await collectTokens(jest.fn());
    const { result: css } = transformToCss(tokens);

    // Parse results for testing
    const styles = {
      solid: parseCssClass(css, 'background-solid-variable'),
      alpha: parseCssClass(css, 'background-solid-alpha-variable'),
    };

    // Snapshot testing for regression detection
    expect(styles).toMatchSnapshot('solid styles');
    
    // Specific value assertions for critical functionality
    expect(styles.solid).toContain('background:');
    expect(styles.alpha).toContain('rgba(');
    
    // Cleanup
    testSetup.cleanup();
  });
});
```

### CSS Parsing Utilities
```typescript
// Helper function to extract CSS class content from generated stylesheets
function parseCssClass(css: string, className: string): string | null {
  const classRegex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'm');
  const match = css.match(classRegex);
  
  if (!match) return null;
  
  // Extract and clean up CSS properties
  return match[1]
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(' ')
    .replace(/;\s*/g, '; ')
    .trim();
}

// Helper to parse specific property values from CSS
function parseCssProperty(css: string, className: string, property: string): string | null {
  const classContent = parseCssClass(css, className);
  if (!classContent) return null;
  
  const propertyRegex = new RegExp(`${property}:\\s*([^;]+);?`);
  const match = classContent.match(propertyRegex);
  
  return match ? match[1].trim() : null;
}
```

## Fixture Management

### Test Data Structure
```typescript
// Example fixture structure (figma-test-data_background.json)
{
  "type": "PAGE",
  "name": "Test Page",
  "children": [
    {
      "type": "FRAME",
      "name": "background-solid-variable",
      "fills": [
        {
          "type": "SOLID",
          "visible": true,
          "opacity": 1,
          "color": { "r": 0, "g": 0.27450980392156865, "b": 0.2901960784313726 }
        }
      ],
      "boundVariables": {
        "fills": [
          { "type": "VARIABLE_ALIAS", "id": "VariableID:5:22" }
        ]
      }
    }
  ],
  "variables": {
    "VariableID:5:22": {
      "id": "VariableID:5:22",
      "name": "teal-800-50",
      "resolvedType": "COLOR",
      "valuesByMode": {
        "5:0": { "r": 0, "g": 0.27450980392156865, "b": 0.2901960784313726, "a": 0.5 }
      }
    }
  }
}
```

### Fixture Generation Strategy
```typescript
// Generate test fixtures from real Figma data
const generateTestFixture = async (figmaNode: BaseNode, fixtureName: string) => {
  const serializedData = await serializeFigmaData(figmaNode);
  
  // Clean up data for testing
  const cleanedData = {
    ...serializedData,
    // Remove non-deterministic properties
    id: 'test-node-id',
    // Normalize timestamps, etc.
  };
  
  // Write to fixture file
  const fixtureData = JSON.stringify(cleanedData, null, 2);
  const fixturePath = `src/tests/fixtures/figma-test-data_${fixtureName}.json`;
  
  await fs.writeFile(fixturePath, fixtureData);
  console.log(`Generated fixture: ${fixturePath}`);
};

// Usage in development/test generation mode
if (process.env.NODE_ENV === 'development') {
  const exportBtn = document.getElementById('exportTestDataBtn');
  exportBtn?.addEventListener('click', async () => {
    const testData = await serializeFigmaData(figma.currentPage);
    parent.postMessage({
      pluginMessage: {
        type: 'test-data-exported',
        data: JSON.stringify(testData, null, 2)
      }
    }, '*');
  });
}
```

## Snapshot Testing Strategy

### Snapshot Test Patterns
```typescript
describe('Demo Data (real world-ish example)', () => {
  it('should process all demo data correctly', async () => {
    // Force feature flag for consistent testing
    jest.spyOn(variants, 'USE_VARIANT_COMBINATION_PARSING').mockReturnValueOnce(false);

    const { setupTest } = createTestData(testDataDemo);
    const testSetup = await setupTest();
    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    // Snapshot entire output for regression detection
    expect(result).toMatchSnapshot('demo-data');
  });
});
```

### Snapshot Organization
```
src/tests/__snapshots__/
├── demo-data-variants.test.ts.snap
├── demo-data.test.ts.snap
├── background-processors.test.ts.snap
├── border-processors.test.ts.snap
└── text-processors.test.ts.snap
```

### Snapshot Maintenance
```typescript
// Helper to update snapshots selectively
const updateSnapshot = (testName: string, newOutput: string) => {
  if (process.env.UPDATE_SNAPSHOTS === 'true') {
    // Update specific snapshot
    expect(newOutput).toMatchSnapshot(testName);
  } else {
    // Normal snapshot comparison
    expect(newOutput).toMatchSnapshot(testName);
  }
};
```

## Mock Strategy Patterns

### 1. Dependency Injection for Testing
```typescript
// Production code with dependency injection
class TokenProcessor {
  constructor(
    private figmaAPI: FigmaAPI = figma,
    private progressReporter: ProgressReporter = defaultReporter
  ) {}
  
  async processTokens(): Promise<TokenCollection> {
    // Use injected dependencies
    await this.figmaAPI.loadAllPagesAsync();
    // ...
  }
}

// Test with mocked dependencies  
it('processes tokens correctly', async () => {
  const mockFigma = createMockFigmaAPI(testData);
  const mockReporter = jest.fn();
  
  const processor = new TokenProcessor(mockFigma, mockReporter);
  const result = await processor.processTokens();
  
  expect(result).toBeDefined();
  expect(mockReporter).toHaveBeenCalled();
});
```

### 2. Partial Mocking Strategy
```typescript
// Mock only specific parts of the Figma API
const createPartialMockFigma = (overrides: Partial<PluginAPI> = {}) => {
  return {
    ...figma, // Use real API where possible
    ...overrides, // Override specific methods for testing
    
    // Always mock storage and UI for tests
    clientStorage: {
      getAsync: jest.fn().mockResolvedValue('{}'),
      setAsync: jest.fn().mockResolvedValue(undefined),
    },
    ui: {
      postMessage: jest.fn(),
      onmessage: null
    }
  };
};
```

### 3. Variable System Mocking
```typescript
const mockVariableSystem = (variables: Record<string, any>) => ({
  getVariableByIdAsync: jest.fn((id: string) => {
    const variable = variables[id];
    return Promise.resolve(variable || null);
  }),
  
  getVariableCollectionByIdAsync: jest.fn((id: string) => {
    // Mock variable collections
    return Promise.resolve({
      id,
      name: 'Test Collection',
      modes: [{ modeId: '5:0', name: 'Mode 1' }],
      defaultModeId: '5:0'
    });
  }),
  
  importVariableByKeyAsync: jest.fn().mockResolvedValue(null)
});
```

## Test Utilities and Helpers

### 1. Test Data Builders
```typescript
class TestNodeBuilder {
  private nodeData: any = { type: 'FRAME', name: 'test-node' };
  
  withType(type: string): this {
    this.nodeData.type = type;
    return this;
  }
  
  withName(name: string): this {
    this.nodeData.name = name;
    return this;
  }
  
  withFills(fills: Paint[]): this {
    this.nodeData.fills = fills;
    return this;
  }
  
  withChildren(children: any[]): this {
    this.nodeData.children = children;
    return this;
  }
  
  build(): any {
    return { ...this.nodeData };
  }
}

// Usage
const testNode = new TestNodeBuilder()
  .withType('TEXT')
  .withName('heading-primary')
  .withFills([{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }])
  .build();
```

### 2. Assertion Helpers
```typescript
// Custom matchers for design token testing
expect.extend({
  toHaveValidCSS(received: string) {
    const hasValidSyntax = /^[^{}]*{[^{}]*}[^{}]*$/.test(received.trim());
    const hasProperties = /:\s*[^;]+;/.test(received);
    
    if (hasValidSyntax && hasProperties) {
      return {
        message: () => `Expected CSS to be invalid`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected valid CSS, but got: ${received}`,
        pass: false
      };
    }
  },

  toHaveProperty(received: string, property: string, value?: string) {
    const propertyRegex = new RegExp(`${property}:\\s*([^;]+);?`);
    const match = received.match(propertyRegex);
    
    const hasProperty = !!match;
    const actualValue = match ? match[1].trim() : null;
    
    if (value) {
      const valuesMatch = actualValue === value;
      return {
        message: () => `Expected ${property}: ${value}, but got ${property}: ${actualValue}`,
        pass: hasProperty && valuesMatch
      };
    } else {
      return {
        message: () => `Expected CSS to have property ${property}`,
        pass: hasProperty
      };
    }
  }
});

// Usage
expect('.test-class { color: red; }').toHaveValidCSS();
expect('.test-class { color: red; }').toHaveProperty('color', 'red');
```

### 3. Test Environment Setup
```typescript
// Global test setup
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Clear global state
  delete global.figma;
  
  // Set up default environment
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Cleanup any remaining global state
  if (global.figma) {
    delete global.figma;
  }
});

// Test suite setup
describe('ProcessorTestSuite', () => {
  let mockFigma: PluginAPI;
  let testSetup: any;
  
  beforeEach(async () => {
    const { setupTest } = createTestData(testData);
    testSetup = await setupTest();
    mockFigma = testSetup.figma;
    global.figma = mockFigma;
  });
  
  afterEach(() => {
    testSetup?.cleanup();
  });
});
```

## Performance Testing

### 1. Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle large token collections efficiently', async () => {
    // Generate large test dataset
    const largeTestData = generateLargeTestData(1000); // 1000 nodes
    
    const { setupTest } = createTestData(largeTestData);
    const testSetup = await setupTest();
    global.figma = testSetup.figma;
    
    const startTime = performance.now();
    const tokens = await collectTokens(jest.fn());
    const endTime = performance.now();
    
    const processingTime = endTime - startTime;
    
    expect(tokens.tokens.length).toBeGreaterThan(0);
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    
    testSetup.cleanup();
  });
});
```

### 2. Memory Usage Testing
```typescript
const measureMemoryUsage = async (operation: () => Promise<any>) => {
  if (typeof performance === 'undefined' || !performance.memory) {
    return null; // Memory API not available
  }
  
  const beforeHeap = performance.memory.usedJSHeapSize;
  await operation();
  const afterHeap = performance.memory.usedJSHeapSize;
  
  return afterHeap - beforeHeap;
};
```

## Integration Points

- **All Domains**: Provides testing infrastructure for every domain
- **Style Processing Pipeline**: Tests individual processors and combinations
- **Output Transformation**: Validates generated CSS/SCSS/Tailwind output
- **Variant Management**: Tests complex variant processing scenarios
- **Design Token Extraction**: Tests node traversal and token collection

## Key Responsibilities

1. **Mock API Creation**: Provide realistic Figma API simulation
2. **Test Data Management**: Generate, maintain, and organize test fixtures
3. **Snapshot Testing**: Regression detection through output comparison
4. **Performance Testing**: Ensure system performance with large datasets
5. **Integration Testing**: Test complete pipeline end-to-end
6. **Utility Provision**: Provide helpers and assertions for domain-specific testing
