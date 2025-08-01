# Code Transformation Domain

The code transformation domain converts collected design tokens into various output formats (SCSS, CSS, Tailwind). Each transformer follows a consistent interface and handles format-specific requirements.

## Transformer Interface

All transformers implement the `TransformerResult` interface:

```typescript
export interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
}
```

## SCSS Transformation Pattern

The SCSS transformer demonstrates the standard transformation approach:

```typescript
export function transformToScss(tokens: TokenCollection): TransformerResult {
  let output = '';
  
  // Deduplicate warnings and errors from style tokens only
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style'),
  );
  
  // Process variables first, then mixins
  const colorVariables = new Map<string, string>();
  tokens.tokens.forEach((token) => {
    if (token.type === 'variable') {
      const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
      colorVariables.set(sanitizeName(token.name), value);
    }
  });
}
```

## Name Sanitization

All output names must be sanitized for target format compatibility:

```typescript
const sanitizedName = sanitizeName(token.name);
```

## Unit Conversion

The system converts pixel values to rem units for SCSS output:

```typescript
const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
```

## Mixin Generation

SCSS transformers generate mixins for component variants:

```typescript
const getMixinPropertyAndValue = (token: StyleToken): Record<string, string> => {
  if (token.property === 'fills' && token?.rawValue?.includes('gradient')) {
    if (token.variables && token.variables.length > 0) {
      const gradientName = `gradient-${sanitizeName(token.name)}`;
      return { [token.property]: `$var(--${gradientName}, #{$${gradientName}})` };
    }
  }
  // ... property processing
};
```

## Error Deduplication

All transformers use the `deduplicateMessages` utility to prevent duplicate warnings and errors in the output.

## Format-Specific Constraints

- **SCSS**: Requires variable parenthesization for negated values
- **CSS**: Uses CSS custom properties (--variables)
- **Tailwind**: Generates utility classes with specific naming conventions
- **Tailwind v4**: Uses @layer utilities syntax
