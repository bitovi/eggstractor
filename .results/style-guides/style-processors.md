# Style Processors Style Guide

## Overview
Style processors are responsible for extracting and processing design properties from Figma nodes into standardized CSS values. They follow a consistent pattern of analyzing node properties and converting them to web-compatible formats.

## File Structure
- `processors/index.ts` - Main orchestrator that maps node types to appropriate processors
- `processors/*.processor.ts` - Individual processors for specific style domains

## Core Patterns

### Processor Definition Pattern
```typescript
export const [domain]Processors: StyleProcessor[] = [
  {
    property: 'css-property-name',
    bindingKey: 'figma-property-key',
    process: async (
      variables: VariableToken[],
      node?: SceneNode,
    ): Promise<ProcessedValue | null> => {
      // Processing logic here
    },
  },
];
```

### Variable Resolution Pattern
```typescript
// Always check for variable bindings first
const propertyVariable = variables.find((v) => v.property === 'bindingKey');
if (propertyVariable) {
  return {
    value: propertyVariable.value,
    rawValue: propertyVariable.rawValue,
  };
}

// Fallback to direct node property processing
```

### Error Handling Pattern
```typescript
const warningsSet = new Set<string>();
const errorsSet = new Set<string>();

// Collect warnings/errors during processing
if (someCondition) {
  warningsSet.add('Warning message');
}

// Return with accumulated warnings/errors
return {
  value: processedValue,
  rawValue: originalValue,
  warnings: Array.from(warningsSet),
  errors: Array.from(errorsSet),
};
```

### Type Guards Pattern
```typescript
interface NodeWithProperty {
  propertyName?: PropertyType;
}

function hasProperty(node: SceneNode): node is SceneNode & NodeWithProperty {
  return 'propertyName' in node;
}

// Usage
if (hasProperty(node)) {
  // node.propertyName is now safely accessible
}
```

## Processing Categories

### Background Processors
- Handle `fills` property for backgrounds
- Process solid colors, gradients, images
- Convert RGBA to CSS string format
- Support variable bindings for design tokens

### Font Processors  
- Handle typography properties (fontSize, fontName, fontWeight, etc.)
- Process text alignment and line height
- Convert Figma font properties to CSS equivalents
- Handle text color via fills processing

### Layout Processors
- Handle positioning and sizing properties
- Process width, height, positioning constraints
- Convert Figma layout properties to CSS layout values

### Border Processors
- Handle stroke properties for borders
- Process border width, color, and style
- Convert Figma stroke properties to CSS border values

### Spacing Processors
- Handle padding and margin properties
- Process auto-layout spacing and padding
- Convert Figma spacing to CSS box model values

## Node Type Mapping

### Text Nodes
- Use `TEXT_PROCESSORS` (font processors only)
- Focus on typography and text-specific properties

### Layout Nodes (FRAME, RECTANGLE, INSTANCE, etc.)
- Use `LAYOUT_PROCESSORS` (background + layout + border + spacing)
- Handle visual and structural properties

## Best Practices

### 1. Variable Precedence
Always check for variable bindings before processing raw values:
```typescript
const variable = variables.find((v) => v.property === bindingKey);
if (variable) {
  return { value: variable.value, rawValue: variable.rawValue };
}
```

### 2. Null Safety
Handle missing or invisible properties gracefully:
```typescript
if (!node || !('property' in node)) return null;
const visibleItems = node.property.filter(item => item.visible);
if (!visibleItems.length) return null;
```

### 3. Error Accumulation
Use Sets to avoid duplicate warnings/errors:
```typescript
const warningsSet = new Set<string>();
const errorsSet = new Set<string>();
```

### 4. Async Processing
Use Promise.all for parallel processing when handling arrays:
```typescript
const results = await Promise.all(
  items.map(async (item) => await processItem(item))
);
```

### 5. Type Safety
Use type guards for safe property access:
```typescript
function hasProperty(node: SceneNode): node is SceneNode & RequiredInterface {
  return 'requiredProperty' in node;
}
```

## Utility Integration
- Use `color.utils.ts` for color conversions
- Use `gradient.utils.ts` for gradient processing  
- Use `value.utils.ts` for value normalization
- Use `units.utils.ts` for unit conversions

## Testing Requirements
- Test with real Figma node data from fixtures
- Test variable binding scenarios
- Test error/warning accumulation
- Test null/undefined handling
- Test different node types and property combinations
