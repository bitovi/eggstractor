# Processors Style Guide

## StyleProcessor Interface Pattern

All processors must implement the exact StyleProcessor interface:

```typescript
export interface StyleProcessor {
  property: string;                    // CSS property name
  bindingKey: keyof VariableBindings | undefined;  // Figma variable binding key
  process: (variables: VariableToken[], node?: SceneNode) => Promise<ProcessedValue | null>;
}
```

## Variable-First Processing Pattern

Always check for Figma variables before falling back to direct node properties:

```typescript
process: async (variables, node): Promise<ProcessedValue | null> => {
  // 1. Check for variable binding first
  const variableValue = variables.find((v) => v.property === 'fills');
  if (variableValue) {
    return {
      value: variableValue.value,
      rawValue: variableValue.rawValue,
    };
  }
  
  // 2. Fall back to direct node property
  if (node && 'fills' in node) {
    // Process node property
  }
  
  return null;
}
```

## Type Guard Pattern for Node Properties

Use type guards to safely check node capabilities:

```typescript
interface NodeWithPadding {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

function hasNodePadding(node: SceneNode): node is SceneNode & NodeWithPadding {
  return (
    'paddingTop' in node &&
    'paddingRight' in node &&
    'paddingBottom' in node &&
    'paddingLeft' in node
  );
}
```

## Error Accumulation Pattern

Use Set data structures to prevent duplicate warnings/errors:

```typescript
const warningsSet = new Set<string>();
const errorsSet = new Set<string>();

// Add warnings/errors during processing
if (result.warnings) {
  result.warnings.forEach((warning) => warningsSet.add(warning));
}

// Return accumulated arrays
return {
  value: processedValue,
  warnings: Array.from(warningsSet),
  errors: Array.from(errorsSet)
};
```

## Null Return Convention

Return null (not undefined) when processor cannot handle the node:

```typescript
if (!node || !hasRequiredProperty(node)) return null;
```

## Multi-Value Consolidation

For properties with multiple values (like padding), consolidate using standard CSS shorthand:

```typescript
// Use all four values or consolidate to shorthand
const values = [top, right, bottom, left];
const value = values.every(v => v === values[0]) 
  ? values[0]  // All same: "10px"
  : values.join(' ');  // Different: "10px 20px 10px 20px"
```
