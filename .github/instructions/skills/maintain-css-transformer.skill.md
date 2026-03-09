# Skill: MaintainCSSTransformer

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the CSS transformer without breaking utility class output or CSS custom property generation.

## Implementation

- File: `packages/figma/src/transformers/css.transformer.ts`
- Exported as: `transformToCss: Transformer`
- Support: `packages/figma/src/utils/theme-tokens.utils.ts` — `generateCssVariablesWithModes()`
- Support: `packages/figma/src/utils/create-naming-context/` — `createNamingContext()`

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
```

## Key Behaviors

- `VariableToken` objects → CSS `--variable-name: value;` declarations inside `:root {}` (TBD)
- `StyleToken` objects → CSS utility classes `.class-name { property: value; }`
- `isVariableReference(part)` — determines if a CSS value part is a `var(--...)` reference
- `generateCssVariablesWithModes()` — generates `:root` and mode-specific `[data-theme]` or `@media` blocks
- `useCombinatorialParsing: true` → tokens pass through `convertVariantGroupBy()` first
- Naming context: default config with `pathSeparator: '-'`

## Naming Context Config (CSS)

Same as SCSS default config: `pathSeparator: '-'`, `afterComponentName: '-'`, `variantEqualSign: '_'`, `betweenVariants: '-'`

## TODO

- [ ] Document how `getClassNamePropertyAndValue()` constructs CSS class selectors from token path
- [ ] Document CSS variable block structure (`:root {}` vs. per-mode selectors)
- [ ] Document `isVariableReference()` — what pattern does it match?
- [ ] Document `outputMode` effect on CSS output
- [ ] Document whether CSS output includes `@layer` blocks or is flat
- [ ] Document how multi-mode `VariableToken` produces multiple CSS variable declarations
