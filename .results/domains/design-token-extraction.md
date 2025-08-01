# Design Token Extraction Domain

## Overview
Core domain responsible for traversing Figma nodes and extracting design tokens using a processor-based architecture. This domain handles the complexity of Figma's node hierarchy and converts it into a standardized token collection.

## Core Implementation

### Token Collection Service (`src/services/collection.service.ts`)
```typescript
export async function collectTokens(onProgress: (progress: number, message: string) => void) {
  const collection: TokenCollection = {
    tokens: [],
    components: {},
    componentSets: {},
    instances: {},
  };

  // Load all pages and get valid nodes
  await figma.loadAllPagesAsync();
  const allPageResults = figma.root.children.map(page => getFlattenedValidNodes(page));
  const allValidNodes = allPageResults.flatMap(result => result.validNodes);
  
  // Process each node with progress tracking
  for (const node of allValidNodes) {
    await processNode(node);
    reportProgress(++processedNodes, totalNodes);
  }
  
  return collection;
}
```

### Node Validation and Filtering
```typescript
export function getFlattenedValidNodes(node: BaseNode): {
  validNodes: BaseNode[];
  warningTokens: StyleToken[];
} {
  const result: BaseNode[] = [];
  const warningTokens: StyleToken[] = [];

  function traverse(currentNode: BaseNode) {
    // Skip VECTOR nodes - not relevant for token extraction
    if (currentNode.type === 'VECTOR') return;
    
    // Skip private/hidden components (. and _ prefixed)
    if ('name' in currentNode && 
        ['.', '_'].some(char => currentNode.name.startsWith(char))) {
      return;
    }
    
    // Handle duplicate component variants
    if (currentNode.type === 'COMPONENT_SET') {
      const { hasDuplicates, duplicateNames } = detectComponentSetDuplicates(currentNode);
      if (hasDuplicates) {
        warningTokens.push(createWarningToken(currentNode, duplicateNames));
        return; // Skip corrupted component sets
      }
    }
    
    result.push(currentNode);
    
    // Traverse children (except for INSTANCE nodes)
    if (currentNode.type !== 'INSTANCE' && 'children' in currentNode) {
      currentNode.children.forEach(traverse);
    }
  }

  traverse(node);
  return { validNodes: result, warningTokens };
}
```

## Key Patterns

### 1. Visitor Pattern for Node Traversal
```typescript
// Each node type is visited by appropriate processors
function traverse(node: BaseNode) {
  const processors = getProcessorsForNode(node as SceneNode);
  return Promise.all(processors.map(processor => 
    processor.process(variables, node)
  ));
}
```

### 2. Pipeline Pattern for Token Processing
```typescript
// Multi-stage processing pipeline
async function processNode(node: BaseNode) {
  // Stage 1: Extract component/variant information
  const componentInfo = extractComponentInfo(node);
  
  // Stage 2: Get applicable processors
  const processors = getProcessorsForNode(node);
  
  // Stage 3: Process each property
  const tokens = await Promise.all(
    processors.map(processor => extractNodeToken(node, processor, path))
  );
  
  // Stage 4: Collect and validate tokens
  collection.tokens.push(...tokens.flat());
}
```

### 3. Observer Pattern for Progress Reporting
```typescript
// Progress tracking with throttled updates
let lastProgressTime = 0;
const reportProgress = (current: number, total: number, message: string) => {
  const now = Date.now();
  if (now - lastProgressTime > 500) { // Throttle updates
    const progress = Math.round((current / total) * 100);
    onProgress(progress, message);
    lastProgressTime = now;
  }
};
```

## Component and Variant Handling

### Component Set Duplicate Detection
```typescript
export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const seenVariants = new Set<string>();
  const duplicateNames: string[] = [];

  if ('children' in componentSetNode) {
    for (const child of componentSetNode.children) {
      if (child.type === 'COMPONENT') {
        const variantName = child.name || 'unnamed';
        if (seenVariants.has(variantName)) {
          duplicateNames.push(variantName);
        } else {
          seenVariants.add(variantName);
        }
      }
    }
  }

  return { duplicateNames, hasDuplicates: duplicateNames.length > 0 };
}
```

### Token Extraction Strategies
```typescript
// Different extraction strategies for different node types
export const extractionStrategies = {
  COMPONENT_SET: extractComponentSetToken,
  COMPONENT: extractComponentToken,
  INSTANCE: extractInstanceToken,
  default: extractNodeToken
};

async function extractTokens(node: SceneNode) {
  const strategy = extractionStrategies[node.type] || extractionStrategies.default;
  return await strategy(node, processors, path);
}
```

## Data Structures

### Token Collection Structure
```typescript
interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
  components: Record<ComponentToken['id'], ComponentToken>;
  componentSets: Record<ComponentSetToken['id'], ComponentSetToken>;
  instances: Record<InstanceToken['id'], InstanceToken>;
}
```

### Path Tracking
```typescript
// Hierarchical path tracking for token organization
interface TokenPath {
  type: SceneNode['type'];
  name: string;
}

// Path construction maintains hierarchy
const path = getNodePathNames(node); // ['Page', 'Frame', 'Component']
```

## Performance Optimizations

### 1. Lazy Loading
```typescript
// Pages are loaded on-demand
await figma.loadAllPagesAsync();
```

### 2. Efficient Node Filtering
```typescript
// Early filtering to reduce processing overhead
if (currentNodeType === 'VECTOR') return; // Skip immediately
if (node.name.startsWith('.') || node.name.startsWith('_')) return; // Skip private
```

### 3. Batch Processing
```typescript
// Process nodes in batches to prevent blocking
const allPageResults = figma.root.children.map(page => getFlattenedValidNodes(page));
const allValidNodes = allPageResults.flatMap(result => result.validNodes);
```

### 4. Memory Management
```typescript
// Efficient token storage and deduplication
const tokensMap = new Map<string, StyleToken>();
// Avoid duplicate token creation
```

## Error Handling and Validation

### 1. Graceful Degradation
```typescript
// Continue processing even if individual nodes fail
try {
  await processNode(node);
} catch (error) {
  console.warn(`Failed to process node ${node.id}:`, error);
  // Continue with next node
}
```

### 2. Warning Collection
```typescript
// Collect warnings for user feedback
const createWarningToken = (node: BaseNode, issues: string[]): StyleToken => ({
  property: `warning-${node.id}`,
  name: 'duplicate-component-warning',
  type: 'style',
  value: null,
  rawValue: null,
  warnings: [`Component set "${node.name}" contains issues: ${issues.join(', ')}`]
});
```

### 3. Data Validation
```typescript
// Validate node structure before processing
if (!('children' in componentSetNode)) {
  return { duplicateNames: [], hasDuplicates: false };
}
```

## Integration Points

- **Style Processing Pipeline**: Delegates to processors for property extraction
- **Variant Management**: Handles component variants and combinations  
- **Output Transformation**: Provides tokens for transformation
- **Testing Infrastructure**: Supports test data serialization

## Responsibilities

1. **Node Traversal**: Efficiently traverse Figma's node hierarchy
2. **Validation**: Filter out invalid, private, or corrupted nodes
3. **Progress Tracking**: Report progress with appropriate throttling
4. **Token Collection**: Aggregate tokens from all processors
5. **Error Management**: Handle errors gracefully without breaking the pipeline
6. **Component Analysis**: Detect and handle component variants and duplicates
