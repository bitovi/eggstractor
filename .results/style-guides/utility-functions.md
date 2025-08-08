# Utility Functions Style Guide

## Domain-Specific Organization

Utilities are organized into focused modules by domain:

- `color.utils.ts`: Color conversion and RGBA handling
- `gradient.utils.ts`: Gradient calculation and CSS generation
- `units.utils.ts`: Unit conversion (px to rem)
- `value.utils.ts`: Value normalization and processing
- `string.utils.ts`: String manipulation and sanitization
- `node.utils.ts`: Figma node operations
- `array.utils.ts`: Array manipulation utilities
- `error.utils.ts`: Error/warning deduplication

## Pure Function Requirement

All utilities must be pure functions with no side effects:

```typescript
// Good: Pure function
export function rgbaToString(r: number, g: number, b: number, a: number): string {
  if (a === 1) {
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

// Bad: Function with side effects (modifies global state)
```

## Mathematical Precision Pattern

Use Math.round() for consistent color value precision:

```typescript
// RGB values always rounded to integers
Math.round(stop.color.r * 255)
```

## Hex Color Formatting

Hex colors must be uppercase and properly padded:

```typescript
const hex = `#${Math.round(stop.color.r * 255)
  .toString(16)
  .padStart(2, '0')}${Math.round(stop.color.g * 255)
  .toString(16)
  .padStart(2, '0')}${Math.round(stop.color.b * 255)
  .toString(16)
  .padStart(2, '0')}`.toUpperCase();
```

## Angle Calculation Convention

Gradient angles use specific CSS conversion formula:

```typescript
function calculateGradientAngle(matrix: Transform): number {
  const [[a], [b]] = matrix;
  let angleRad = Math.atan2(b, a);
  let angleDeg = (angleRad * 180) / Math.PI;
  
  // CSS gradient convention adjustment
  angleDeg = (-angleDeg + 90 + 360) % 360;
  return Math.round(angleDeg);
}
```

## Error Result Pattern

Functions that can fail return result objects with warnings/errors:

```typescript
export function processGradient(fill: GradientPaint, nodeId?: string): ProcessorResult {
  return {
    value: gradientCss,
    warnings: Array.from(warnings),
    errors: Array.from(errors)
  };
}
```

## Null Safety Convention

Handle null/undefined inputs gracefully:

```typescript
export const normalizeValue = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  // Process valid values
}
```

## Set-Based Deduplication

Use Set data structures for deduplication:

```typescript
export function deduplicateMessages(tokens: StyleToken[]): {
  warnings: string[];
  errors: string[];
} {
  const warnings = new Set<string>();
  const errors = new Set<string>();
  // Deduplication logic
  return {
    warnings: Array.from(warnings),
    errors: Array.from(errors)
  };
}
```
