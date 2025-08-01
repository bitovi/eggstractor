# Tailwind Transformers Style Guide

## Overview
Tailwind transformers convert design tokens into Tailwind CSS utility classes and configuration. They handle Tailwind-specific naming conventions, utility generation, and theme configuration.

## File Structure
- `transformers/tailwind/index.ts` - Main Tailwind transformer orchestrator
- `transformers/tailwind/generators.ts` - Utility class generation logic
- `transformers/tailwind/filters.ts` - Token filtering for Tailwind compatibility

## Core Patterns

### Token Filtering Pattern
```typescript
export function filterStyleTokens({ tokens }: TokenCollection): {
  styleTokens: NonNullableStyleToken[];
  warnings: string[];
  errors: string[];
} {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();

  const styleTokens = tokens.filter((token): token is NonNullableStyleToken => {
    // Extract warnings/errors during filtering
    if ('warnings' in token && token.warnings) {
      token.warnings.forEach((warning: string) => warningsSet.add(warning));
    }
    
    return (
      token.type === 'style' &&
      token.value != null &&
      token.rawValue != null
    );
  });

  return { styleTokens, warnings: Array.from(warningsSet), errors: Array.from(errorsSet) };
}
```

### Utility Generation Pattern
```typescript
export function createTailwindClasses(tokens: NonNullableStyleToken[]): string[] {
  return tokens.map(token => {
    // Convert CSS property to Tailwind utility
    const utilityClass = convertPropertyToUtility(token.property, token.value);
    return utilityClass;
  });
}
```

### Theme Configuration Pattern
```typescript
const { spacing, colors, borderWidths, borderRadius, fontWeight, fontFamily, fontSize } = themeTokens;

// Use theme tokens for consistent configuration
const themeConfig = {
  spacing,
  colors,
  borderWidth: borderWidths,
  // ...other theme properties
};
```

## Tailwind-Specific Conventions

### Property Mapping
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

### Direction Mapping
```typescript
const directions = ['t', 'r', 'b', 'l'] as const;

const flexDirection: Record<string, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};
```

### Four-Sides Normalization
```typescript
export function normalizeFourSides(value: string): [string, string, string, string] {
  const [a, b = a, c = a, d = b] = value.trim().split(/\s+/);
  return [a, b, c, d];
}
```

## Utility Class Generation

### Basic Utility Pattern
```typescript
function generateUtilityClass(property: string, value: string): string {
  // Convert CSS property to Tailwind class name
  const prefix = getUtilityPrefix(property);
  const suffix = normalizeValue(value);
  return `${prefix}-${suffix}`;
}
```

### Responsive Utilities
```typescript
function generateResponsiveUtilities(token: StyleToken): string[] {
  const baseClass = generateUtilityClass(token.property, token.value);
  const responsiveClasses = breakpoints.map(bp => `${bp}:${baseClass}`);
  return [baseClass, ...responsiveClasses];
}
```

### State Utilities
```typescript
function generateStateUtilities(token: StyleToken): string[] {
  const baseClass = generateUtilityClass(token.property, token.value);
  const stateClasses = states.map(state => `${state}:${baseClass}`);
  return stateClasses;
}
```

## Theme Integration

### Color System
```typescript
const colors = {
  primary: {
    50: '#color-value',
    500: '#color-value',
    900: '#color-value',
  },
  // Generated from design tokens
};
```

### Spacing System
```typescript
const spacing = {
  '0': '0px',
  '1': '0.25rem',
  '2': '0.5rem',
  // Generated from design tokens
};
```

### Typography System
```typescript
const fontSize = {
  'xs': ['0.75rem', { lineHeight: '1rem' }],
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  // Generated from design tokens
};
```

## Best Practices

### 1. Token Validation
Filter tokens before processing:
```typescript
const validTokens = tokens.filter(token => 
  token.value != null && token.rawValue != null
);
```

### 2. Error Collection
Accumulate errors during filtering:
```typescript
if ('errors' in token && token.errors) {
  token.errors.forEach((error: string) => errorsSet.add(error));
}
```

### 3. Utility Naming
Follow Tailwind conventions:
```typescript
// Good: text-red-500, bg-blue-100, p-4
// Bad: textRed500, backgroundColor100, padding4
```

### 4. Value Normalization
Normalize values for Tailwind compatibility:
```typescript
const normalizedValue = value.replace(/[^a-zA-Z0-9-]/g, '-');
```

### 5. Theme Consistency
Use theme tokens for consistent configuration:
```typescript
import { themeTokens } from '../../theme-tokens';
const { colors, spacing } = themeTokens;
```

## Variant Support

### Pseudo-class Variants
```typescript
const pseudoClasses = ['hover', 'focus', 'active', 'disabled'];
```

### Responsive Variants
```typescript
const breakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
```

### Custom Variants
```typescript
const customVariants = ['dark', 'light', 'print'];
```

## Output Formats

### Utility Classes
```typescript
// Generated utility classes
const utilities = [
  'text-red-500',
  'bg-blue-100',
  'p-4',
  'hover:bg-blue-200'
];
```

### Theme Configuration
```typescript
// Generated theme config
module.exports = {
  theme: {
    extend: {
      colors: { /* generated colors */ },
      spacing: { /* generated spacing */ }
    }
  }
}
```

### SASS Integration
```typescript
// Generated SASS classes with Tailwind utilities
@apply text-red-500 bg-blue-100 p-4;
```

## Testing Requirements
- Test utility class generation accuracy
- Test theme configuration completeness
- Test variant handling (responsive, pseudo-classes)
- Test value normalization edge cases
- Test error handling during filtering
- Validate Tailwind CSS compatibility
