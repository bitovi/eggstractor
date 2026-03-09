# Agent: CodeGenerationAgent

## Purpose

Transforms a `TokenCollection` into stylesheet output. Owns format routing, all transformer implementations (CSS, SCSS, Tailwind v3/v4), the variants/combinatorial middleware, naming context creation, and rem conversion. The only agent that reads `StylesheetFormat` and `OutputMode` to select a code path.

## Source Files

- `packages/figma/src/index.ts` — `transformTokensToStylesheet()` format router
- `packages/figma/src/transformers/css.transformer.ts` — `transformToCss`
- `packages/figma/src/transformers/scss.transformer.ts` — `transformToScss`
- `packages/figma/src/transformers/tailwind/index.ts` — `transformToTailwindSassClass`, `transformToTailwindLayerUtilityClassV4`
- `packages/figma/src/transformers/tailwind/generators.ts` — `Generator`, `GeneratorToken`, `buildDynamicThemeTokens()`
- `packages/figma/src/transformers/tailwind/filters.ts` — `filterStyleTokens()`
- `packages/figma/src/transformers/variants/convert-variant-group-by.ts` — `convertVariantGroupBy()`
- `packages/figma/src/transformers/variants/generate-combinatorial-styles.ts` — `generateCombinatorialStyles()`
- `packages/figma/src/transformers/variants/convert-to-generator-tokens.ts` — `convertToGeneratorTokens()` (**deprecated** — interim shim; see domain)
- `packages/figma/src/transformers/types/transformer.ts` — `Transformer` type
- `packages/figma/src/transformers/utils/deduplicate-messages.utils.ts` — `deduplicateMessages()`
- `packages/figma/src/transformers/utils/updated-padding-based-on-border.utils.ts` — `updatePaddingStylesBasedOnBorder()`
- `packages/figma/src/utils/create-naming-context/` — `createNamingContext()`, `NamingContext`
- `packages/figma/src/utils/mode.utils.ts` — `normalizeModeName()`
- `packages/figma/src/utils/theme-tokens.utils.ts` — `generateCssVariablesWithModes()`, `generateScssVariablesWithModes()`, `generateThemeDirective()`, `generateSemanticColorUtilities()`, `generateScssLayerUtilitiesFromModes()`, `buildDynamicThemeTokens()`
- `packages/figma/src/utils/units.utils.ts` — `rem()`, `px()`, `em()`

## Skills Used

- [MaintainSCSSTransformer](../skills/maintain-scss-transformer.skill.md)
- [MaintainCSSTransformer](../skills/maintain-css-transformer.skill.md)
- [MaintainTailwindV3Transformer](../skills/maintain-tailwind-v3-transformer.skill.md)
- [MaintainTailwindV4Transformer](../skills/maintain-tailwind-v4-transformer.skill.md)
- [MaintainVariantsMiddleware](../skills/maintain-variants-middleware.skill.md)
- [MaintainNamingContext](../skills/maintain-naming-context.skill.md)

## Domain Knowledge

### `Transformer` Signature

```typescript
type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
  generateSemanticColorUtilities?: boolean,
  outputMode?: OutputMode,
) => TransformerResult;
```

### Format Routing

```
StylesheetFormat     → Transformer
'scss'               → transformToScss
'css'                → transformToCss
'tailwind-scss'      → transformToTailwindSassClass
'tailwind-v4'        → transformToTailwindLayerUtilityClassV4
```

The central router (`transformTokensToStylesheet`) calls the appropriate transformer and throws on unknown formats:

```typescript
function transformTokensToStylesheet(
  tokens: Readonly<TokenCollection>,
  format: StylesheetFormat,
  useCombinatorialParsing: boolean,
  generateSemanticColorUtilities?: boolean,
  outputMode?: OutputMode,
): TransformerResult {
  switch (format) {
    case 'scss':
      return transformToScss(
        tokens,
        useCombinatorialParsing,
        generateSemanticColorUtilities,
        outputMode,
      );
    case 'css':
      return transformToCss(
        tokens,
        useCombinatorialParsing,
        generateSemanticColorUtilities,
        outputMode,
      );
    case 'tailwind-scss':
      return transformToTailwindSassClass(
        tokens,
        useCombinatorialParsing,
        generateSemanticColorUtilities,
        outputMode,
      );
    case 'tailwind-v4':
      return transformToTailwindLayerUtilityClassV4(
        tokens,
        useCombinatorialParsing,
        generateSemanticColorUtilities,
        outputMode,
      );
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

### `OutputMode` Behaviour

`OutputMode` (`'variables' | 'components' | 'all'`) controls which sections each transformer emits. Default is `'all'`.

| `outputMode`   | CSS transformer                                                          | SCSS transformer                     | Tailwind SCSS transformer                     | Tailwind v4 transformer                                 |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------ | --------------------------------------------- | ------------------------------------------------------- |
| `'variables'`  | CSS variables block only (`generateCssVariablesWithModes`), no selectors | SCSS variables block only, no mixins | CSS variables + `@layer` utilities, no mixins | `@theme` directive only, no `@utility` blocks           |
| `'components'` | Selectors only, no variables block                                       | Mixins only, no variables block      | Mixins with `@apply` only, no variables       | `@utility` directives + semantic utilities, no `@theme` |
| `'all'`        | Variables block + selectors                                              | Variables block + mixins             | CSS variables + `@layer` utilities + mixins   | `@theme` + semantic utilities + `@utility` blocks       |

### `TransformerResult` Shape

```typescript
interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
}
```

### Naming Context Configs

- CSS/default: `pathSeparator: '-'`, `afterComponentName: '-'`, `variantEqualSign: '_'`, `betweenVariants: '-'`
- Tailwind v4: `pathSeparator: '/'`, `afterComponentName: '.'`, `variantEqualSign: '_'`, `betweenVariants: '.'`

Full interface and exported constants:

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

### Combinatorial Parsing (Variants Middleware)

When `useCombinatorialParsing: true`, style tokens grouped by variant combination are passed through `convertVariantGroupBy()` → `generateCombinatorialStyles()` before emitting selectors. This produces the cross-product of variant states as individual CSS selectors.

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

### SCSS Variable Naming

Variables that start with a numeric character are prefixed with `v` (e.g., `$v400` not `$400`). The `getSCSSVariableName()` function handles this:

```typescript
const getSCSSVariableName = (variableName: string): string => {
  let scssVariableName = variableName;
  if (!/^[a-zA-Z]/.test(scssVariableName)) {
    scssVariableName = 'v' + scssVariableName;
  }
  return `$${scssVariableName}`;
};
```

### SCSS Mixin Generation

Style tokens are converted to mixins via `getMixinPropertyAndValue()`. Key logic:

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

### rem Conversion

Numeric dimension values (px) are converted to `rem` via `rem(value)` using a 16px baseline. Properties that should NOT convert: `font-weight`, `opacity`, `line-height` (unitless).

```typescript
export const rem = (value: string | number): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) {
    return typeof value === 'string' ? value : String(value);
  }
  return `${numericValue / 16}rem`;
};
```

Tokens carry a `valueType` discriminator:

```typescript
interface StyleToken {
  value: string | null;
  rawValue: string | null;
  valueType?: 'px' | 'rem' | 'string';
  property: string;
  // ... other properties
}
```

### Tailwind `@apply` Ordering Quirk

When using Tailwind v4 `@apply`, Tailwind reorders utilities by CSS property + numeric value — NOT by authored order. Built-in utilities sort by property first, then numerically. Custom utilities sort alphabetically. This is documented in `docs/declaration-order.md` and must be accounted for when generating combinatorial Tailwind output.

Full rules:

- **Built-in utilities**: sorted by CSS property (internal ordering), then **numerically** within the same property. The highest numeric value wins.
- **Custom `@utility` blocks**: sorted **alphabetically by utility name**. The last name alphabetically wins.

CombinatorialTailwind output must be designed so the _intended winning utility_ happens to be last under Tailwind's sort — not last as written. Full examples are in [`docs/declaration-order.md`](../../../docs/declaration-order.md).

### CSS Transformer Implementation

The CSS transformer creates utility classes from filtered style tokens:

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

  selectors.forEach((variant) => {
    output += `\n.${variant.selector} {\n`;
    Object.entries(variant.properties).forEach(([property, value]) => {
      output += `  ${property}: ${value};\n`;
    });
    output += '}\n';
  });

  return { result: output, warnings, errors };
};

const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;
  return { [token.property]: value };
};
```

### Tailwind v3 Generator System

Tailwind transformers use a `Generator`/`GeneratorToken` pattern for utility creation:

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

Generators can use path context to pick the right utility prefix:

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
    for (const rule of contextRules) {
      if (rule.condition(token)) {
        return `${rule.prefix}-${normalizeColorValue(token.rawValue, colorTheme)}`;
      }
    }
    return `${defaultPrefix}-${normalizeColorValue(token.rawValue, colorTheme)}`;
  };
```

### `convertToGeneratorTokens()` — Deprecated

Located in `packages/figma/src/transformers/variants/convert-to-generator-tokens.ts`. Converts variant `Selector[]` into a flat `GeneratorToken[]` shape used by the legacy Tailwind v3 generator loop. **Marked `@deprecated` in source.** Both Tailwind transformers still call it as an interim shim; the long-term intent is to drive class generation directly from the `Selector` shape without this intermediary.

### Utility Function Details

#### `deduplicateMessages()`

Accepts **any array of objects with optional `warnings`/`errors` string arrays** — not specifically `StyleToken[]`. Deduplication is string-equality based via `Set`. Called once per transformer after all tokens are processed:

```typescript
export function deduplicateMessages(tokens: { warnings?: string[]; errors?: string[] }[]): {
  warnings: string[];
  errors: string[];
} {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();

  tokens.forEach((token) => {
    token.warnings?.forEach((w) => warningsSet.add(w));
    token.errors?.forEach((e) => errorsSet.add(e));
  });

  return {
    warnings: Array.from(warningsSet),
    errors: Array.from(errorsSet),
  };
}
```

#### `updatePaddingStylesBasedOnBorder()`

Located in `packages/figma/src/transformers/utils/updated-padding-based-on-border.utils.ts`. When a variant instance has **both** border and padding properties, Figma's padding values already include the border width visually. This utility **subtracts each side's border width from the corresponding padding value** to produce correct CSS box-model output.

- Called inside `convertVariantGroupBy()` for every processed instance.
- Uses `parseCssValue()` to handle `px`, `rem`, and shorthand values.
- Clamps results at `0` — padding can never be negative.
- For mismatched or unknown units falls back to `calc(padding - border)`.
- Only runs when the instance has **both** a padding property AND a border property.

#### `filterStyleTokens()`

Located in `packages/figma/src/transformers/tailwind/filters.ts`. Filters a `TokenCollection` down to tokens suitable for Tailwind class generation:

- Returns only `StyleToken` entries where `value` and `rawValue` are non-null.
- Accumulates `warnings` and `errors` from tokens it drops so callers can still surface them.
- Called by both Tailwind transformers before `convertVariantGroupBy()`.

### Multi-Mode Variable Helpers

All helpers live in `packages/figma/src/utils/theme-tokens.utils.ts`.

#### `generateCssVariablesWithModes(collection)`

Outputs a `:root {}` block of CSS custom properties for every `VariableToken`. When the collection contains `ModeVariableToken` entries (tokens with `modeId` / `modes` / `modeValues`), it also emits `[data-theme="<mode>"] {}` override blocks — one per non-typography mode. Typography-only modes (font-family, font-weight, font-size, line-height) are filtered out by `filterTypographyOnlyModes()`. Used by CSS transformer (`outputMode: 'variables'|'all'`) and Tailwind SCSS transformer.

#### `generateScssVariablesWithModes(collection)`

Same as above but emits SCSS `$variable: value;` declarations instead of CSS custom properties. Used by SCSS transformer.

#### `generateThemeDirective(collection, generateSemantics?)`

Outputs a Tailwind v4 `@theme { … }` block mapping every variable token to `--<name>: <value>`. When `generateSemantics` is `true`, semantic color variables are excluded from `@theme` (emitted instead as `@utility` blocks via `generateSemanticColorUtilities()`). Used exclusively by the Tailwind v4 transformer.

#### `generateSemanticColorUtilities(semanticColorTokens)`

Takes filtered semantic color `VariableToken`s and emits Tailwind v4 `@utility <name> { color: var(--<name>); }` blocks, one per token. Controlled by the `generateSemantics` flag. When `false` (Tailwind SCSS mode), this is skipped; instead `generateScssLayerUtilitiesFromModes()` emits `@layer utilities {}` blocks.

#### `generateScssLayerUtilitiesFromModes(semanticColorTokens)`

SCSS-mode equivalent of `generateSemanticColorUtilities`. Emits `@layer utilities { .utilityName { … } }` blocks using CSS variables, suitable for pre-compiled SCSS output. Used by the Tailwind SCSS transformer.

#### `buildDynamicThemeTokens(variableTokens, generateSemantics)`

Builds a `DynamicTheme` object (`{ colors, borderRadius, spacing, … }`) by scanning the variable token list. When `generateSemantics` is `true`, semantic color tokens are mapped directly by their `semanticVariableName` (bypassing the `bg-/text-` prefix logic). This `DynamicTheme` is passed to every `Generator` in `generators.ts` so Tailwind utility names reference variable-driven design tokens rather than hard-coded theme values.

#### `normalizeModeName(modeName)`

Located in `packages/figma/src/utils/mode.utils.ts`. Converts a raw Figma mode name into a CSS-safe token (e.g., `"Dark Mode"` → `"dark-mode"`). Used by `extractModesFromTokens()` when building the `[data-theme]` override blocks.

## TODO — Needs Investigation

- [ ] Clarify whether v4 transformer uses `generateCombinatorialStyles()` or has its own variant handling
- [ ] Document the full `buildDynamicThemeTokens()` output shape (`DynamicTheme` interface) with field-level detail
- [ ] Verify `normalizeModeName()` edge-case behaviour (digits, slashes, emoji in mode names)
