# Code Generation Domain

## Overview

The code generation domain transforms structured token collections into production-ready stylesheets. This system supports multiple output formats (CSS, SCSS, Tailwind) with both template and combinatorial parsing modes, ensuring consistent and maintainable stylesheet generation.

## Transformer Architecture

### Universal Transformer Interface

All transformers implement the same interface for consistency:

```typescript
export type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
) => TransformerResult;

export interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
}
```

### Format Routing

Format selection is handled centrally in the main thread:

```typescript
function transformTokensToStylesheet(
  tokens: Readonly<TokenCollection>,
  format: StylesheetFormat,
  useCombinatorialParsing: boolean,
): TransformerResult {
  switch (format) {
    case 'scss':
      return transformToScss(tokens, useCombinatorialParsing);
    case 'css':
      return transformToCss(tokens, useCombinatorialParsing);
    case 'tailwind-scss':
      return transformToTailwindSassClass(tokens, useCombinatorialParsing);
    case 'tailwind-v4':
      return transformToTailwindLayerUtilityClassV4(tokens, useCombinatorialParsing);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

## SCSS Transformer Implementation

### Variable Generation Pattern

The SCSS transformer processes tokens in a specific order:

```typescript
export const transformToScss: Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
): TransformerResult => {
  let output = '';

  // 1. Process Figma variables first
  const colorVariables = new Map<string, string>();
  tokens.tokens.forEach((token) => {
    if (token.type === 'variable') {
      const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
      colorVariables.set(sanitizeName(token.name), value);
    }
  });

  if (colorVariables.size > 0) {
    output += '// Generated SCSS Variables\n';
  }

  // Output color variables
  colorVariables.forEach((value, name) => {
    output += `${getSCSSVariableName(name)}: ${value};\n`;
  });
};
```

### Variable Naming Convention

SCSS variables follow a consistent naming pattern:

```typescript
const getSCSSVariableName = (variableName: string): string => {
  let scssVariableName = variableName;

  if (!/^[a-zA-Z]/.test(scssVariableName)) {
    scssVariableName = 'v' + scssVariableName;
  }

  return `$${scssVariableName}`;
};
```

### Mixin Generation

Style tokens are converted to mixins with property-value pairs:

```typescript
const getMixinPropertyAndValue = (token: StyleToken): Record<string, string> => {
  if (token.property === 'fills' && token?.rawValue?.includes('gradient')) {
    if (token.variables && token.variables.length > 0) {
      const gradientName = `gradient-${sanitizeName(token.name)}`;
      return {
        [token.property]: `$var(--${gradientName}, #{${getSCSSVariableName(gradientName)}})`,
      };
    }

    const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
    return { [token.property]: value };
  }

  const baseValue = token.valueType === 'px' ? rem(token.value!) : token.value;
  // Handle SCSS negated variables with parentheses
  const processedValue = baseValue
    ?.replace(/-\$(\w|-)+/g, (match) => `(${match})`)
    ?.replace(/\$(?!-)([^a-zA-Z])/g, (_, char) => `$v${char}`);
  return { [token.property]: processedValue! };
};
```

## CSS Transformer Implementation

### Class Generation

The CSS transformer creates utility classes from tokens:

```typescript
export const transformToCss: Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
): TransformerResult => {
  let output = '/* Generated CSS */';

  const styleTokens = tokens.tokens.filter(
    (token): token is StyleToken =>
      token.type === 'style' && token.value != null && token.rawValue != null,
  );

  const namingContext = createNamingContext();
  const groupedTokens = groupBy(styleTokens, (token: StyleToken) => token.name);

  const selectors = convertVariantGroupBy(
    tokens,
    groupedTokens,
    getClassNamePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  // Generate CSS rules from selectors
  selectors.forEach((variant) => {
    output += `\n.${variant.selector} {\n`;
    Object.entries(variant.properties).forEach(([property, value]) => {
      output += `  ${property}: ${value};\n`;
    });
    output += '}\n';
  });

  return { result: output, warnings, errors };
};
```

### Property Value Processing

CSS values are processed:

```typescript
const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;

  return {
    [token.property]: value,
  };
};
```

## Tailwind Transformer Implementation

### Generator System

Tailwind transformers use a generator-based approach for utility creation:

```typescript
export type GeneratorToken = { rawValue: string; property: string; path: StyleToken['path'] };
export type Generator = (token: GeneratorToken, dynamicTheme?: DynamicTheme) => string;

const generators: Record<string, Generator> = {
  background: (token: GeneratorToken, dynamicTheme?: DynamicTheme) =>
    createContextAwareColorGenerator('bg', [
      {
        condition: (token) => token.path?.some((pathItem) => pathItem.type === 'VECTOR'),
        prefix: 'text',
      },
    ])(token, dynamicTheme?.colors || colors),

  'border-radius': ({ rawValue }: GeneratorToken, dynamicTheme?: DynamicTheme) =>
    `rounded-${normalizeTailwindToken(dynamicTheme?.borderRadius || borderRadius, rawValue)}`,

  padding: (token: GeneratorToken, dynamicTheme?: DynamicTheme) =>
    generateTailwindPaddingClass(token, dynamicTheme?.spacing || spacing),
};
```

### Context-Aware Generation

Tailwind generators can use context from the token's path to determine appropriate utility classes:

```typescript
export const createContextAwareColorGenerator =
  (
    defaultPrefix: string,
    contextRules: Array<{
      condition: (token: GeneratorToken) => boolean;
      prefix: string;
    }>,
  ) =>
  (token: GeneratorToken, colorTheme: Record<string, string> = colors): string => {
    // Find first matching context rule
    for (const rule of contextRules) {
      if (rule.condition(token)) {
        return `${rule.prefix}-${normalizeColorValue(token.rawValue, colorTheme)}`;
      }
    }

    // Default behavior
    return `${defaultPrefix}-${normalizeColorValue(token.rawValue, colorTheme)}`;
  };
```

## Naming Context System

### Configuration-Based Naming

All transformers use a naming context system for consistent token naming:

```typescript
export interface NamingContextConfig {
  env: 'css' | 'scss ' | 'tailwind-v4' | 'tailwind-v3-sass';
  includePageInPath?: boolean;
  delimiters: {
    pathSeparator: string;
    afterComponentName: string;
    variantEqualSign: string;
    betweenVariants: string;
  };
  duplicate?: (name: string, count: number) => string;
}

export const defaultContextConfig = {
  env: 'css',
  includePageInPath: true,
  delimiters: {
    pathSeparator: '-',
    afterComponentName: '-',
    variantEqualSign: '_',
    betweenVariants: '-',
  },
  duplicate: (name: string, count: number) => `${name}${count}`,
} as const satisfies DefaultNamingContextConfig;

export const tailwind4NamingConfig = {
  env: 'tailwind-v4',
  delimiters: {
    pathSeparator: '/',
    afterComponentName: '.',
    variantEqualSign: '_',
    betweenVariants: '.',
  },
} as const satisfies NamingContextConfig;
```

## Parsing Mode System

### Template vs Combinatorial Parsing

All transformers support two parsing modes:

**Template Parsing** (`useCombinatorialParsing: false`):

- Generates one class/mixin per component
- Combines all properties into single selectors
- Simpler output, fewer classes

**Combinatorial Parsing** (`useCombinatorialParsing: true`):

- Generates utility classes for each property
- Creates fine-grained, reusable utilities
- More classes but better composition

```typescript
const selectors = convertVariantGroupBy(
  collection,
  groupedTokens,
  getStylePropertyAndValue,
  namingContext,
  useCombinatorialParsing,
);
```

## Unit Processing

### Consistent Unit Handling

The system automatically converts pixel values to rem units for consistency:

```typescript
export const rem = (value: string | number): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return typeof value === 'string' ? value : String(value);
  }

  return `${numericValue / 16}rem`;
};
```

### Value Type Detection

Tokens track their value types for appropriate processing:

```typescript
interface StyleToken {
  value: string | null;
  rawValue: string | null;
  valueType?: 'px' | 'rem' | 'string';
  property: string;
  // ... other properties
}
```

## Error Handling and Validation

### Message Deduplication

All transformers deduplicate warnings and errors:

```typescript
export const deduplicateMessages = (tokens: StyleToken[]) => {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();

  tokens.forEach((token) => {
    if (token.warnings) {
      token.warnings.forEach((warning) => warningsSet.add(warning));
    }
    if (token.errors) {
      token.errors.forEach((error) => errorsSet.add(error));
    }
  });

  return {
    warnings: Array.from(warningsSet),
    errors: Array.from(errorsSet),
  };
};
```

This code generation architecture ensures consistent, high-quality stylesheet output across all supported formats while maintaining flexibility for different use cases and preferences.
