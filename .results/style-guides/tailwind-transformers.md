# Tailwind Transformers Style Guide

## Theme Token Integration

Tailwind transformers must integrate with the theme tokens system:

```typescript
import { themeTokens } from '../../theme-tokens';

const { spacing, colors, borderWidths, borderRadius, fontWeight, fontFamily, fontSize } =
  themeTokens;
```

## Value Normalization Function

Use consistent four-side value normalization:

```typescript
export function normalizeFourSides(value: string): [string, string, string, string] {
  const [a, b = a, c = a, d = b] = value.trim().split(/\s+/);
  return [a, b, c, d];
}
```

## Property Shorthand Mapping

Define consistent property to Tailwind class mappings:

```typescript
const borderPropertyToShorthand: Record<string, string> = {
  border: 'border',
  'border-top': 'border-t',
  'border-right': 'border-r',
  'border-bottom': 'border-b',
  'border-left': 'border-l',
  'border-x': 'border-x',
  'border-y': 'border-y',
};
```

## Set-Based Value Validation

Use Set data structures for efficient value validation:

```typescript
const borderStyles = new Set([
  'none', 'hidden', 'dotted', 'dashed', 'solid', 
  'double', 'groove', 'ridge', 'inset', 'outset',
]);

// Usage
if (borderStyles.has(value)) {
  // Valid border style
}
```

## Direction Array Constants

Define direction constants for consistent ordering:

```typescript
const directions = ['t', 'r', 'b', 'l'] as const;
```

## CSS Value to Class Mapping

Create explicit mappings for CSS values to Tailwind classes:

```typescript
const flexDirection: Record<string, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

const alignItems: Record<string, string> = {
  stretch: 'items-stretch',
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
};
```

## Co-Located Testing

Keep transformer tests co-located with implementation:

```typescript
// generators.test.ts lives alongside generators.ts
// in the same tailwind/ directory
```

## Version-Specific Generators

Separate generators for different Tailwind versions:

- Tailwind v3: SCSS-style utilities
- Tailwind v4: `@layer utilities` syntax

Each version has specific output format requirements that must be maintained.
