# Output Transformers Style Guide

## Overview
Output transformers convert processed design tokens into various output formats (CSS, SCSS, Tailwind). They handle deduplication, variant processing, and format-specific optimizations.

## File Structure
- `transformers/index.ts` - Central exports for all transformers
- `transformers/css.transformer.ts` - CSS output generation
- `transformers/scss.transformer.ts` - SCSS output generation
- `transformers/variants.ts` - Variant processing logic
- `transformers/variants-middleware.ts` - Variant middleware utilities
- `transformers/tailwind/` - Tailwind-specific transformers

## Core Patterns

### Transformer Function Signature
```typescript
export function transformTo[Format](tokens: TokenCollection): TransformerResult {
  // Transformation logic
  return {
    output: string,
    warnings: string[],
    errors: string[]
  };
}
```

### Token Filtering Pattern
```typescript
// Filter for valid style tokens
const styleTokens = tokens.tokens.filter(
  (token): token is StyleToken =>
    token.type === 'style' &&
    token.value != null &&
    token.value !== '' &&
    token.rawValue != null &&
    token.rawValue !== '',
);
```

### Error Deduplication Pattern
```typescript
import { deduplicateMessages } from '../utils/error.utils';

const { warnings, errors } = deduplicateMessages(styleTokens);
```

### Unit Conversion Pattern
```typescript
import { rem } from '../utils/units.utils';

const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;
  return { [token.property]: value };
};
```

## Format-Specific Guidelines

### CSS Transformer
- Generate standard CSS classes
- Convert px values to rem units
- Handle variant combinations
- Filter out zero values and defaults
- Group tokens by component name

### SCSS Transformer
- Generate SCSS with variables and mixins
- Support SCSS-specific features (nesting, variables)
- Maintain compatibility with CSS patterns

### Tailwind Transformer
- Generate Tailwind utility classes
- Follow Tailwind naming conventions
- Create theme configuration objects
- Support custom utility generation

## Variant Processing

### Input Format
```typescript
type Input = {
  variants: Record<string, string>;
  css: Record<string, string>;
}[];
```

### Variant Combination Parsing
```typescript
export const USE_VARIANT_COMBINATION_PARSING = (): boolean => {
  return true; // Enable combination parsing
}
```

### StyleNode Structure
```typescript
type StyleNode = {
  cssProperty: string;
  cssValue: string;
  variants: Record<string, string>;
  possibleVariants: Record<string, string>;
  id: number;
};
```

## Best Practices

### 1. Token Validation
Always validate tokens before processing:
```typescript
const validTokens = tokens.filter(
  token => token.value != null && token.value !== ''
);
```

### 2. Value Optimization
Remove unnecessary default values:
```typescript
// Skip zero values for certain properties
if (token.property === 'margin' && token.value === '0') {
  continue;
}
```

### 3. Error Handling
Accumulate and deduplicate errors:
```typescript
const { warnings, errors } = deduplicateMessages(tokens);
```

### 4. Unit Consistency
Convert units consistently across formats:
```typescript
const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;
```

### 5. Grouping Strategy
Group tokens logically for output:
```typescript
const variantGroups = Object.entries(groupBy(styleTokens, (t) => t.name));
```

## Output Structure

### CSS Output
```css
/* Generated CSS */
.component-name {
  property: value;
}

.component-name--variant {
  property: variant-value;
}
```

### SCSS Output
```scss
// Generated SCSS
$component-name-property: value;

.component-name {
  property: $component-name-property;
  
  &--variant {
    property: variant-value;
  }
}
```

### Tailwind Output
```javascript
// Generated Tailwind Config
module.exports = {
  theme: {
    extend: {
      colors: { /* color tokens */ },
      spacing: { /* spacing tokens */ },
      fontFamily: { /* font tokens */ }
    }
  }
}
```

## Middleware Integration

### Variant Middleware
- Process variant combinations
- Handle complex variant logic
- Support nested variant structures

### Transformation Pipeline
1. Token validation and filtering
2. Error deduplication
3. Variant processing
4. Format-specific transformation
5. Output generation

## Testing Requirements
- Test with various token types and combinations
- Test variant processing edge cases
- Test output format correctness
- Test error handling and deduplication
- Test unit conversion accuracy
- Validate generated code syntax
