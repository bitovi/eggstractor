# Services Style Guide

## Function Naming Convention

Service functions use descriptive action verbs with specific suffixes:

- `extract*`: Extract tokens from Figma nodes
- `collect*`: Gather and aggregate data
- `detect*`: Identify patterns or issues
- `get*`: Retrieve processed data

```typescript
export const extractInstanceSetToken = async (node: InstanceNode): Promise<InstanceToken>
export const collectTokens = (): TokenCollection  
export function detectComponentSetDuplicates(node: BaseNode)
export function getFlattenedValidNodes(node: BaseNode)
```

## Node Traversal Pattern

Use recursive traverse functions with early returns for filtering:

```typescript
function traverse(currentNode: BaseNode) {
  const currentNodeType = 'type' in currentNode ? currentNode.type : null;
  
  // Skip VECTOR nodes
  if (currentNodeType === 'VECTOR') {
    return;
  }
  
  // Skip hidden/private nodes (names starting with . or _)
  if ('name' in currentNode && ['.', '_'].some((char) => currentNode.name.startsWith(char))) {
    return;
  }
  
  // Process current node
  result.push(currentNode);
  
  // Continue traversal for children
  if ('children' in currentNode) {
    // Recursive call
  }
}
```

## Warning Token Generation

Create warning tokens for problematic structures with specific properties:

```typescript
function createWarningToken(componentSetNode: BaseNode, duplicateNames: string[]): StyleToken {
  return {
    property: `warning-${componentSetNode.id}`,
    name: `duplicate-component-warning`,
    type: 'style',
    value: null,
    rawValue: null,
    path: [{ name: componentSetNode.name || 'unnamed', type: 'COMPONENT_SET' }],
    warnings: [
      `Component set "${componentSetNode.name}" contains duplicate variants: ${duplicateNames.join(', ')}`
    ],
    componentSetId: componentSetNode.id,
  };
}
```

## Async Component Resolution

Always await component resolution for instance nodes:

```typescript
export const extractInstanceSetToken = async (node: InstanceNode): Promise<InstanceToken> => {
  const componentNode = await node.getMainComponentAsync();
  
  return {
    // Include remote component information
    remote: componentNode?.remote ?? false,
    componentNode,
  };
}
```

## Path Resolution Integration

Use utility functions for consistent path name resolution:

```typescript
import { getNodePathNames } from '../utils/node.utils';

// Apply to extracted tokens
const path = getNodePathNames(node);
```

## Duplicate Detection Strategy

Use Set data structures for efficient duplicate detection:

```typescript
const seenVariants = new Set<string>();
const duplicateNames: string[] = [];

for (const child of componentSetNode.children) {
  const variantName = JSON.stringify(child.variantProperties || {});
  if (seenVariants.has(variantName)) {
    duplicateNames.push(child.name);
  } else {
    seenVariants.add(variantName);
  }
}
```
