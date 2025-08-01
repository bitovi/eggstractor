# Transformers Style Guide

## TransformerResult Interface

All transformers must return the exact TransformerResult interface:

```typescript
export interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
}
```

## Error Deduplication Pattern

Always deduplicate warnings and errors from tokens:

```typescript
export function transformToScss(tokens: TokenCollection): TransformerResult {
  // Deduplicate warnings and errors from style tokens only
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style'),
  );
}
```

## Name Sanitization Requirement

All output names must be sanitized for target format compatibility:

```typescript
import { sanitizeName } from '../utils/index';

// Apply to all token names
const sanitizedName = sanitizeName(token.name);
```

## Unit Conversion Convention

Convert pixel values to rem units for SCSS output:

```typescript
import { rem } from '../utils/units.utils';

const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
```

## Variable vs Mixin Generation

SCSS transformers separate variables from mixins:

```typescript
// First pass: collect variables
const colorVariables = new Map<string, string>();
tokens.tokens.forEach((token) => {
  if (token.type === 'variable') {
    const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
    colorVariables.set(sanitizeName(token.name), value);
  }
});

// Second pass: generate mixins for style tokens
// (separate processing logic)
```

## Gradient Variable Handling

Special handling for gradient properties with CSS variable fallbacks:

```typescript
if (token.property === 'fills' && token?.rawValue?.includes('gradient')) {
  if (token.variables && token.variables.length > 0) {
    const gradientName = `gradient-${sanitizeName(token.name)}`;
    return { [token.property]: `$var(--${gradientName}, #{$${gradientName}})` };
  }
  // Use raw value if no variables
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
  return { [token.property]: value };
}
```

## SCSS Negated Variable Pattern

Parenthesize negated SCSS variables to prevent parsing warnings:

```typescript
// in SCSS negated variables are a parsing warning unless parenthesized
const processedValue = baseValue?.replace(/-\$(\w|-)+/g, (match) => `(${match})`);
```

## Mixin Property Consolidation

Group related properties into single mixins:

```typescript
const getMixinPropertyAndValue = (token: StyleToken): Record<string, string> => {
  // Return object with property-value pairs for mixin generation
}
```
