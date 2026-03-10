# Figma Processors Style Guide

## Unique Conventions in This Codebase

### Node Type Routing Pattern

**Unique Pattern**: Processors assigned based on Figma node types with predefined arrays:

```tsx
const TEXT_PROCESSORS = fontProcessors;
const LAYOUT_PROCESSORS = [
  ...backgroundProcessors,
  ...layoutProcessors,
  ...borderProcessors,
  ...spacingProcessors,
];

export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case 'TEXT':
      return TEXT_PROCESSORS;
    case 'FRAME':
    case 'RECTANGLE':
    case 'INSTANCE':
      return LAYOUT_PROCESSORS;
    default:
      return [];
  }
}
```

### Variable Binding Integration

**Unique Pattern**: Processors check for Figma variable bindings before extracting literal values:

```tsx
process: async (variableTokenMapByProperty, node) => {
  const fillVariable = variableTokenMapByProperty.get('fills');
  if (fillVariable) {
    return { value: fillVariable.value, rawValue: fillVariable.rawValue };
  }

  // Fallback to literal value extraction
  const { r, g, b } = fill.color;
  const value = rgbaToString(r, g, b, a);
  return { value, rawValue: value };
};
```

### Processor Array Export Pattern

**Unique Pattern**: Each processor file exports an array, not individual processors:

```tsx
export const backgroundProcessors: StyleProcessor[] = [
  { property: 'background', bindingKey: 'fills', process: async (...) => {} }
];
```
