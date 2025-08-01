# Design Token Services Style Guide

## Overview
This style guide covers the service layer responsible for token collection, node processing, and variable management in the design token extraction pipeline.

## File Structure
```
src/services/
├── index.ts              - Service exports and public API
├── collection.service.ts - Main token collection orchestration
├── token.service.ts      - Individual token extraction logic
└── variable.service.ts   - Variable resolution and management
```

## Code Style Standards

### 1. Service Interface Design
```typescript
// ✅ Good: Clean, focused service interfaces
export interface TokenCollectionService {
  collectTokens(onProgress: ProgressCallback): Promise<TokenCollection>;
  getFlattenedValidNodes(node: BaseNode): NodeCollectionResult;
  detectComponentSetDuplicates(node: BaseNode): DuplicateAnalysis;
}

export interface TokenExtractionService {
  extractNodeToken(
    node: SceneNode,
    processor: StyleProcessor,
    path: TokenPath,
    componentInfo?: ComponentInfo
  ): Promise<StyleToken[]>;
}

// ❌ Bad: Overly complex or unclear interfaces
export interface TokenService {
  doEverything(stuff: any): Promise<any>;
}
```

### 2. Progress Callback Pattern
```typescript
// ✅ Good: Standardized progress reporting
export type ProgressCallback = (progress: number, message: string) => void;

export async function collectTokens(onProgress: ProgressCallback): Promise<TokenCollection> {
  const collection: TokenCollection = {
    tokens: [],
    components: {},
    componentSets: {},
    instances: {},
  };

  let totalNodes = 0;
  let processedNodes = 0;

  // Count nodes first for accurate progress
  onProgress(0, 'Loading pages...');
  await figma.loadAllPagesAsync();
  
  onProgress(5, 'Counting nodes...');
  const allValidNodes = figma.root.children.flatMap(page => 
    getFlattenedValidNodes(page).validNodes
  );
  totalNodes = allValidNodes.length;

  // Process with progress updates
  for (const node of allValidNodes) {
    await processNode(node);
    processedNodes++;
    
    const progress = Math.round((processedNodes / totalNodes) * 100);
    onProgress(progress, `Processing ${node.name || 'unnamed'}...`);
  }

  return collection;
}

// ❌ Bad: No progress reporting or unclear progress
export async function collectTokens(): Promise<TokenCollection> {
  // No progress feedback to user
  const nodes = getAllNodes();
  return processAllNodes(nodes);
}
```

### 3. Node Validation and Filtering
```typescript
// ✅ Good: Comprehensive node validation with clear logic
export function getFlattenedValidNodes(node: BaseNode): {
  validNodes: BaseNode[];
  warningTokens: StyleToken[];
} {
  const result: BaseNode[] = [];
  const warningTokens: StyleToken[] = [];

  function traverse(currentNode: BaseNode): void {
    const currentNodeType = 'type' in currentNode ? currentNode.type : null;

    // Skip irrelevant node types with clear reasoning
    if (currentNodeType === 'VECTOR') {
      console.debug(`Skipping VECTOR node: ${currentNode.id} - not relevant for token extraction`);
      return;
    }

    // Skip private/hidden components with validation
    if ('name' in currentNode && 
        ['.', '_'].some(char => currentNode.name.startsWith(char))) {
      console.debug(`Skipping private node: ${currentNode.name} - marked as hidden`);
      return;
    }

    // Handle component set duplicates
    if (currentNode.type === 'COMPONENT_SET') {
      const { hasDuplicates, duplicateNames } = detectComponentSetDuplicates(currentNode);
      if (hasDuplicates) {
        console.warn(`⏭️ Skipping corrupted component set: ${currentNode.name}`);
        warningTokens.push(createWarningToken(currentNode, duplicateNames));
        return;
      }
    }

    result.push(currentNode);

    // Traverse children appropriately
    if (currentNodeType !== 'INSTANCE' && 'children' in currentNode) {
      currentNode.children.forEach(traverse);
    }
  }

  traverse(node);
  return { validNodes: result, warningTokens };
}

// ❌ Bad: Unclear validation logic or missing edge cases
export function getNodes(node: BaseNode): BaseNode[] {
  const result = [];
  // Missing validation, unclear logic
  if (node.children) {
    result.push(...node.children);
  }
  return result;
}
```

### 4. Component Set Duplicate Detection
```typescript
// ✅ Good: Thorough duplicate detection with clear reporting
export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const duplicateNames: string[] = [];
  const seenVariants = new Set<string>();

  // Validate node structure
  if (!('children' in componentSetNode)) {
    return { duplicateNames, hasDuplicates: false };
  }

  // Check each component variant
  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      const variantName = child.name || 'unnamed';

      if (seenVariants.has(variantName)) {
        console.warn(
          `🚨 DUPLICATE VARIANT in "${componentSetNode.name}" component set:\n` +
          `  Layer: "${variantName}"\n` +
          `  Found duplicate layers in Figma - check the layers panel for identical component names`
        );
        duplicateNames.push(variantName);
      } else {
        seenVariants.add(variantName);
      }
    }
  }

  return {
    duplicateNames,
    hasDuplicates: duplicateNames.length > 0
  };
}

// ❌ Bad: Missing validation or unclear error reporting
export function checkDuplicates(node: any): boolean {
  // Unclear what this checks or how it handles errors
  return false;
}
```

### 5. Token Extraction Pattern
```typescript
// ✅ Good: Structured token extraction with proper error handling
export async function extractNodeToken(
  node: SceneNode,
  processor: StyleProcessor,
  path: BaseToken['path'],
  componentToken?: ComponentToken | null,
  componentSetToken?: ComponentSetToken | null,
): Promise<(StyleToken | VariableToken)[]> {
  const tokens: (StyleToken | VariableToken)[] = [];

  try {
    // Extract and resolve variables first
    const variableTokensMap = new Map<string, VariableToken>();
    
    if (processor.bindingKey && 'boundVariables' in node) {
      const boundVariables = node.boundVariables;
      if (boundVariables && processor.bindingKey in boundVariables) {
        const binding = boundVariables[processor.bindingKey];
        
        if (Array.isArray(binding)) {
          for (const alias of binding) {
            if (isVariableAlias(alias)) {
              const variableToken = await extractVariableToken(alias, processor.property, path);
              if (variableToken) {
                variableTokensMap.set(variableToken.property, variableToken);
              }
            }
          }
        } else if (isVariableAlias(binding)) {
          const variableToken = await extractVariableToken(binding, processor.property, path);
          if (variableToken) {
            variableTokensMap.set(variableToken.property, variableToken);
          }
        }
      }
    }

    // Process the node with the processor
    const processedValue = await processor.process([...variableTokensMap.values()], node);
    
    if (processedValue?.value !== null || processedValue?.rawValue !== null) {
      // Create style token with full context
      const componentId = componentToken?.id;
      const componentSetId = componentSetToken?.id;
      
      const styleToken: StyleToken = {
        type: 'style',
        property: processor.property,
        name: path.map(p => p.name).join('_'),
        value: processedValue.value,
        rawValue: processedValue.rawValue,
        valueType: processedValue.valueType,
        path,
        variables: variableTokensMap.size > 0 ? [...variableTokensMap.values()] : undefined,
        metadata: {
          figmaId: node.id,
        },
        warnings: processedValue.warnings,
        errors: processedValue.errors,
        componentId,
        componentSetId,
      };
      
      tokens.push(styleToken);
    }

    // Add variable tokens to collection
    tokens.push(...variableTokensMap.values());

  } catch (error) {
    console.error(`Failed to extract token from node ${node.id}:`, error);
    
    // Create error token for tracking
    const errorToken: StyleToken = {
      type: 'style',
      property: processor.property,
      name: `error_${node.id}`,
      value: null,
      rawValue: null,
      path,
      errors: [`Token extraction failed: ${error.message}`],
      metadata: { figmaId: node.id }
    };
    
    tokens.push(errorToken);
  }

  return tokens;
}

// ❌ Bad: Poor error handling or unclear extraction logic
export async function extractToken(node: any, processor: any): Promise<any[]> {
  const result = await processor.process(node);
  return [result]; // Missing error handling, validation, context
}
```

## Naming Conventions

### Service Functions
```typescript
// ✅ Good: Clear, action-oriented naming
export async function collectTokens(callback: ProgressCallback): Promise<TokenCollection>
export async function extractNodeToken(node: SceneNode, processor: StyleProcessor): Promise<StyleToken[]>
export async function extractVariableToken(alias: VariableAlias, property: string): Promise<VariableToken>
export function getFlattenedValidNodes(node: BaseNode): NodeCollectionResult
export function detectComponentSetDuplicates(node: BaseNode): DuplicateAnalysis

// ❌ Bad: Unclear or overly generic naming
export async function process(input: any): Promise<any>
export function get(node: any): any
export function check(thing: any): boolean
```

### Data Structures
```typescript
// ✅ Good: Descriptive interface names with clear structure
export interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
  components: Record<ComponentToken['id'], ComponentToken>;
  componentSets: Record<ComponentSetToken['id'], ComponentSetToken>;
  instances: Record<InstanceToken['id'], InstanceToken>;
}

export interface NodeCollectionResult {
  validNodes: BaseNode[];
  warningTokens: StyleToken[];
}

export interface DuplicateAnalysis {
  duplicateNames: string[];
  hasDuplicates: boolean;
}

// ❌ Bad: Generic or unclear interface names
export interface Result {
  data: any[];
  other: Record<string, any>;
}
```

## Error Handling Patterns

### 1. Graceful Degradation
```typescript
// ✅ Good: Continue processing even when individual items fail
async function processAllNodes(nodes: BaseNode[]): Promise<TokenCollection> {
  const collection: TokenCollection = { /* ... */ };
  const errors: string[] = [];

  for (const node of nodes) {
    try {
      const tokens = await processNode(node);
      collection.tokens.push(...tokens);
    } catch (error) {
      console.warn(`Failed to process node ${node.id}:`, error);
      errors.push(`Node ${node.name || node.id}: ${error.message}`);
      // Continue with next node
    }
  }

  if (errors.length > 0) {
    console.warn(`Processing completed with ${errors.length} errors:`, errors);
  }

  return collection;
}

// ❌ Bad: Stop entire process on first error
async function processAllNodes(nodes: BaseNode[]): Promise<TokenCollection> {
  for (const node of nodes) {
    await processNode(node); // Will throw and stop entire process
  }
}
```

### 2. Warning Token Creation
```typescript
// ✅ Good: Create informative warning tokens for tracking issues
function createWarningToken(componentSetNode: BaseNode, duplicateNames: string[]): StyleToken {
  return {
    property: `warning-${componentSetNode.id}`,
    name: `duplicate-component-warning`,
    type: 'style',
    value: null,
    rawValue: null,
    path: [{ name: componentSetNode.name || 'unnamed', type: 'COMPONENT_SET' }],
    warnings: [
      `Component set "${componentSetNode.name}" contains duplicate variants: ${duplicateNames.join(', ')}. ` +
      `Remove duplicate components in Figma to fix this issue.`,
    ],
    componentSetId: componentSetNode.id,
    metadata: {
      figmaId: componentSetNode.id
    }
  };
}

// ❌ Bad: Silent failures or unclear warning reporting
function handleDuplicates(node: BaseNode): void {
  // Silently ignore or unclear what happens
}
```

## Performance Guidelines

### 1. Efficient Node Traversal
```typescript
// ✅ Good: Single-pass traversal with early exits
export function getFlattenedValidNodes(node: BaseNode): NodeCollectionResult {
  const validNodes: BaseNode[] = [];
  const warningTokens: StyleToken[] = [];
  
  // Use iterative approach for large trees to avoid stack overflow
  const stack: BaseNode[] = [node];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    
    // Early exits for performance
    if (shouldSkipNode(current)) {
      continue;
    }
    
    validNodes.push(current);
    
    // Add children to stack if applicable
    if ('children' in current && current.type !== 'INSTANCE') {
      stack.push(...current.children);
    }
  }
  
  return { validNodes, warningTokens };
}

// ❌ Bad: Inefficient recursive traversal
export function getNodes(node: BaseNode): BaseNode[] {
  const result = [node];
  if ('children' in node) {
    node.children.forEach(child => {
      result.push(...getNodes(child)); // Deep recursion, potential stack overflow
    });
  }
  return result;
}
```

### 2. Progress Throttling
```typescript
// ✅ Good: Throttled progress updates to prevent UI flooding
export async function collectTokens(onProgress: ProgressCallback): Promise<TokenCollection> {
  let lastProgressTime = 0;
  let lastPercentage = -1;
  const PROGRESS_THROTTLE_MS = 500;
  const PROGRESS_THRESHOLD = 1; // Only update if progress changed by 1%

  const reportProgress = (current: number, total: number, message: string) => {
    const now = Date.now();
    const percentage = Math.round((current / total) * 100);
    
    // Throttle by time and percentage change
    if (now - lastProgressTime > PROGRESS_THROTTLE_MS || 
        Math.abs(percentage - lastPercentage) >= PROGRESS_THRESHOLD) {
      onProgress(percentage, message);
      lastProgressTime = now;
      lastPercentage = percentage;
    }
  };

  // Use in processing loop
  for (let i = 0; i < nodes.length; i++) {
    await processNode(nodes[i]);
    reportProgress(i + 1, nodes.length, `Processing ${nodes[i].name}...`);
  }
}

// ❌ Bad: Unthrottled progress updates
export async function collectTokens(onProgress: ProgressCallback): Promise<TokenCollection> {
  for (let i = 0; i < nodes.length; i++) {
    await processNode(nodes[i]);
    onProgress(i / nodes.length * 100, 'Processing...'); // Called for every node
  }
}
```

## Testing Standards

### 1. Service Testing
```typescript
// ✅ Good: Comprehensive service testing with mocks
describe('TokenCollectionService', () => {
  let mockFigma: jest.Mocked<PluginAPI>;
  let progressCallback: jest.Mock;

  beforeEach(() => {
    mockFigma = createMockFigmaAPI();
    global.figma = mockFigma;
    progressCallback = jest.fn();
  });

  afterEach(() => {
    delete global.figma;
  });

  describe('collectTokens', () => {
    it('should collect tokens with progress reporting', async () => {
      // Setup test data
      const testNodes = createTestNodes();
      mockFigma.root.children = testNodes;

      // Execute
      const result = await collectTokens(progressCallback);

      // Verify
      expect(result).toHaveProperty('tokens');
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(progressCallback).toHaveBeenCalledWith(0, 'Loading pages...');
      expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
    });

    it('should handle processing errors gracefully', async () => {
      // Setup failing node
      const failingNode = createFailingTestNode();
      mockFigma.root.children = [failingNode];

      // Execute
      const result = await collectTokens(progressCallback);

      // Should complete despite errors
      expect(result).toBeDefined();
      expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
    });
  });
});

// ❌ Bad: Incomplete or unclear testing
describe('Service', () => {
  it('should work', async () => {
    const result = await someFunction();
    expect(result).toBeDefined();
  });
});
```

## Documentation Standards

### 1. Service Documentation
```typescript
/**
 * Collects design tokens from the current Figma file
 * 
 * This function traverses all pages in the Figma file, extracts design tokens
 * from valid nodes, and reports progress through the provided callback.
 * 
 * @param onProgress - Callback function for progress updates (0-100, message)
 * @returns Promise resolving to complete token collection
 * @throws {Error} When Figma API is unavailable or token extraction fails critically
 * 
 * @example
 * ```typescript
 * const tokens = await collectTokens((progress, message) => {
 *   console.log(`${progress}%: ${message}`);
 * });
 * console.log(`Collected ${tokens.tokens.length} tokens`);
 * ```
 */
export async function collectTokens(
  onProgress: ProgressCallback
): Promise<TokenCollection>

/**
 * Analyzes a component set for duplicate variant names
 * 
 * Component sets should have unique variant names. This function detects
 * duplicates and provides detailed information for fixing the issue.
 * 
 * @param componentSetNode - The component set node to analyze
 * @returns Analysis result with duplicate names and status
 * 
 * @example
 * ```typescript
 * const analysis = detectComponentSetDuplicates(componentSet);
 * if (analysis.hasDuplicates) {
 *   console.warn(`Found duplicates: ${analysis.duplicateNames.join(', ')}`);
 * }
 * ```
 */
export function detectComponentSetDuplicates(
  componentSetNode: BaseNode
): DuplicateAnalysis
```

## File Organization

### Service Index
```typescript
// src/services/index.ts - Export public API
export { collectTokens, getFlattenedValidNodes } from './collection.service';
export { extractNodeToken, extractVariableToken } from './token.service';
export { resolveVariableAlias, getVariableValue } from './variable.service';

// Re-export types for convenience
export type { TokenCollection, ProgressCallback } from './collection.service';
export type { StyleToken, VariableToken } from '../types';
```

### Import Order
```typescript
// 1. Node.js built-ins (none in this case)
// 2. External libraries (none in this case)
// 3. Internal types and interfaces
import { ComponentSetToken, ComponentToken, StyleToken, TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';

// 4. Internal utilities
import { getNodePathNames } from '../utils/node.utils';

// 5. Sibling services
import {
  extractComponentSetToken,
  extractComponentToken,
  extractInstanceSetToken,
  extractNodeToken,
} from './token.service';
```
