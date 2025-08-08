# Utility System Domain

The utility system provides pure, stateless functions organized by domain-specific concerns. All utilities maintain strict type safety and handle edge cases gracefully.

## Domain Organization

Utilities are organized into focused modules:

- `color.utils.ts`: Color conversion and manipulation
- `gradient.utils.ts`: Gradient processing and CSS generation  
- `units.utils.ts`: Unit conversion (px to rem)
- `value.utils.ts`: Value normalization and processing
- `string.utils.ts`: String manipulation and sanitization
- `node.utils.ts`: Figma node path and name resolution
- `array.utils.ts`: Array manipulation utilities
- `error.utils.ts`: Error and warning deduplication

## Color Utilities

Color utilities handle RGBA conversion and color space operations:

```typescript
export function rgbaToString(r: number, g: number, b: number, a: number): string {
  if (a === 1) {
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
```

## Unit Conversion

The `rem` utility converts pixel values to rem units:

```typescript
export function rem(value: string | number): string {
  // Conversion logic from px to rem
}
```

## Value Normalization

Value utilities provide consistent processing patterns:

```typescript
export const normalizeValue = (value: any): string | null => {
  // Handles various input types and normalizes to string output
}
```

## String Sanitization

Name sanitization ensures output compatibility with target formats:

```typescript
export function sanitizeName(name: string): string {
  // Converts design names to valid CSS/SCSS identifiers
}
```

## Error Deduplication

Error utilities prevent duplicate messages in the output:

```typescript
export function deduplicateMessages(tokens: StyleToken[]): {
  warnings: string[];
  errors: string[];
} {
  const warnings = new Set<string>();
  const errors = new Set<string>();
  // Deduplication logic
}
```

## Node Path Resolution

Node utilities extract hierarchical path information:

```typescript
export function getNodePathNames(node: SceneNode): PathItem[] {
  // Builds path from node hierarchy
}
```

## Pure Function Constraints

All utilities follow these constraints:

- No side effects or global state modification
- Null-safe parameter handling
- Consistent return types
- No external dependencies beyond type definitions
- Stateless operation (same input always produces same output)
