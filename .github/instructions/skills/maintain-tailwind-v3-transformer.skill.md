# Skill: MaintainTailwindV3Transformer

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the Tailwind v3 transformer without breaking the generator system, dynamic theme token map, or @apply-based utility class output.

## Implementation

- File: `packages/figma/src/transformers/tailwind/index.ts`
- Exported as: `transformToTailwindSassClass: Transformer`
- Support: `packages/figma/src/transformers/tailwind/generators.ts` — `Generator`, `GeneratorToken`, `buildDynamicThemeTokens()`
- Support: `packages/figma/src/transformers/tailwind/filters.ts` — `filterStyleTokens()`
- Support: `packages/figma/src/transformers/variants/convert-to-generator-tokens.ts` — `convertToGeneratorTokens()` (deprecated)

## Input

```typescript
tokens: TokenCollection
useCombinatorialParsing: boolean
generateSemanticColorUtilities?: boolean
outputMode?: OutputMode
```

## Output

```typescript
TransformerResult { result: string; warnings: string[]; errors: string[]; }
// result: SCSS file with @apply-based Tailwind utility classes
```

## Key Types

```typescript
type GeneratorToken = {
  rawValue: string;
  property: string;
  path: StyleToken['path'];
  semanticVariableName?: string;
};
type Generator = (token: GeneratorToken, dynamicTheme?: DynamicTheme) => string;
```

## Key Behaviors

- `filterStyleTokens()` excludes null-value tokens before generator processing
- `buildDynamicThemeTokens()` builds a property-keyed map of known Tailwind values for class lookup
- Each `GeneratorToken` is passed through a property-specific `Generator` function to produce a Tailwind class string
- Output uses `@apply` directives — subject to Tailwind's reordering behavior (see `docs/declaration-order.md`)
- `convertToGeneratorTokens()` is deprecated — retained for backwards compatibility with this flow

## DynamicTheme Shape

```typescript
interface DynamicTheme {
  spacing?: Record<string, string>;
  colors?: Record<string, string>;
  borderWidths?: Record<string, string>;
  borderRadius?: Record<string, string>;
  fontWeight?: Record<string, string>;
  fontFamily?: Record<string, string[]>;
  fontSize?: Record<string, string>;
  boxShadow?: Record<string, string>;
}
```

## TODO

- [ ] Document how `Generator` functions map CSS properties to Tailwind class names
- [ ] Document what happens when a token value has no Tailwind equivalent (fallback behavior)
- [ ] Document `normalizeFourSides()`, `normalizeTwoSides()`, `normalizeBorderRadius()` usage
- [ ] Document `createTailwindClasses()` function signature and output
- [ ] Document the full `@apply` reordering issue in context of v3 output
- [ ] Document migration path away from `convertToGeneratorTokens()` deprecation
