# Service Layer Domain

The service layer orchestrates token collection from Figma nodes and manages the extraction workflow. It provides the primary interface between the plugin's main thread and the processing pipeline.

## Central Collection Function

The `collectTokens` function is the main entry point for token extraction:

```typescript
export function collectTokens(): TokenCollection {
  // Orchestrates all token extraction from current page
}
```

## Node-Specific Extraction Functions

Different node types have dedicated extraction functions:

```typescript
// Component instances
export const extractInstanceSetToken = async (node: InstanceNode): Promise<InstanceToken>

// Component definitions  
export const extractComponentToken = (node: ComponentNode, componentSetToken?: ComponentSetToken): ComponentToken

// Component sets (variant containers)
export const extractComponentSetToken = (node: ComponentSetNode): ComponentSetToken

// General style tokens
export const extractNodeToken = async (node: SceneNode): Promise<StyleToken[]>
```

## Variable Binding Service

The variable service resolves Figma variable bindings to actual values:

```typescript
export const collectBoundVariable = (
  node: SceneNode,
  bindingKey: keyof VariableBindings,
): VariableToken | null
```

## Component Variant Handling

The service detects and handles duplicate component variants:

```typescript
export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const duplicateNames: string[] = [];
  const seenVariants = new Set<string>();
  
  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      // Variant duplicate detection logic
    }
  }
}
```

## Warning Token Generation

The service generates warning tokens for problematic component structures:

```typescript
function createWarningToken(componentSetNode: BaseNode, duplicateNames: string[]): StyleToken {
  return {
    property: `warning-${componentSetNode.id}`,
    name: `duplicate-component-warning`,
    type: 'style',
    warnings: [
      `Component set "${componentSetNode.name}" contains duplicate variants: ${duplicateNames.join(', ')}`
    ],
  };
}
```

## Path Name Resolution

The service uses utility functions to resolve node path names:

```typescript
import { getNodePathNames } from '../utils/node.utils';
```

## Remote Component Support

The extraction functions handle both local and remote Figma components:

```typescript
return {
  remote: componentNode?.remote ?? false,
  componentNode,
}
```
