# Figma Transformers Style Guide

## Unique Conventions in This Codebase

### Universal Transformer Interface

**Unique Pattern**: All transformers implement identical interface regardless of output format:

```tsx
export type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
) => TransformerResult;
```

### Parsing Mode Branching

**Unique Pattern**: Single transformer handles both template and combinatorial modes:

```tsx
export const transformToScss: Transformer = (tokens, useCombinatorialParsing) => {
  // Always process variables first
  const colorVariables = new Map<string, string>();

  // Then branch on parsing mode
  const selectors = convertVariantGroupBy(
    collection,
    groupedTokens,
    getMixinPropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );
};
```

### SCSS Variable Naming Convention

**Unique Pattern**: Variable names sanitized with 'v' prefix for non-alphabetic starts:

```tsx
const getSCSSVariableName = (variableName: string): string => {
  let scssVariableName = variableName;
  if (!/^[a-zA-Z]/.test(scssVariableName)) {
    scssVariableName = 'v' + scssVariableName; // Prefix with 'v'
  }
  return `$${scssVariableName}`;
};
```

### Automatic Rem Conversion

**Unique Pattern**: Pixel values automatically converted to rem with 16px base:

```tsx
export const rem = (value: string | number): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return typeof value === 'string' ? value : String(value);
  return `${numericValue / 16}rem`;
};
```
