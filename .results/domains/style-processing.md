# Style Processing Domain

The style processing domain handles the extraction and transformation of visual properties from Figma nodes into structured tokens. This is the core processing engine of the plugin.

## Architecture Pattern

All style processing follows the **StyleProcessor** interface pattern:

```typescript
export interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings | undefined;
  process: (variables: VariableToken[], node?: SceneNode) => Promise<ProcessedValue | null>;
}
```

## Node Type Routing

The system routes different Figma node types to appropriate processors:

```typescript
export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case 'TEXT':
      return TEXT_PROCESSORS;
    case 'FRAME':
    case 'RECTANGLE':
    case 'INSTANCE':
    case 'ELLIPSE':
    case 'COMPONENT':
      return LAYOUT_PROCESSORS;
    default:
      return [];
  }
}
```

## Processor Categories

**Text Processors**: Handle font-related properties
- color (from fills)
- font-family, font-size, font-weight
- line-height, letter-spacing
- text-align

**Layout Processors**: Handle visual layout properties
- background (fills and gradients)
- borders (color, width, radius, style)
- spacing (padding, margin, gap)
- layout (width, height, opacity)

## Variable Binding Resolution

Processors check for Figma variable bindings first, then fall back to direct property values:

```typescript
const colorVariable = variables.find((v) => v.property === 'fills');
if (colorVariable) {
  return {
    value: colorVariable.value,
    rawValue: colorVariable.rawValue,
  };
}
```

## Error Handling Pattern

All processors accumulate warnings and errors without throwing exceptions:

```typescript
const warningsSet = new Set<string>();
const errorsSet = new Set<string>();
// ... processing logic ...
if (result.warnings) {
  result.warnings.forEach((warning) => warningsSet.add(warning));
}
```

## Null Safety

Processors must return `null` when properties don't exist or aren't applicable to the node type, ensuring the transformation pipeline handles missing data gracefully.
