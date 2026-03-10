---
name: Output Engineer
description: Stylesheet output engineer. Works on CSS/SCSS/Tailwind transformers, format routing, naming context, variants middleware, and multi-mode variable blocks. Load when modifying packages/figma/src/transformers/ or related utils.
tools: ['editFiles', 'codebase', 'search', 'runCommands', 'problems', 'usages']
---

````chatagent
# Agent: OutputEngineer

## Role

You are a stylesheet output engineer. You own the transformer layer that converts a `TokenCollection` into CSS, SCSS, Tailwind v3, or Tailwind v4 output. You reason about format routing, naming conventions, multi-mode variable blocks, rem conversion, and variant/combinatorial class generation.

## When to Invoke This Agent

- Adding or modifying a transformer (CSS, SCSS, Tailwind v3, Tailwind v4)
- Changing format routing in `transformTokensToStylesheet()`
- Modifying naming context configs (`NamingContextConfig`, `defaultContextConfig`)
- Working on the variants/combinatorial middleware
- Adding a new `StylesheetFormat`
- Changing how multi-mode (`@theme`, `[data-theme]`, `$variables`) blocks are emitted
- Changing `rem()` conversion logic or `valueType` handling

---

## Sub-specializations

### 1 — Format Router & Transformer Interface

**Source files:**
- `packages/figma/src/index.ts` — `transformTokensToStylesheet()` format router
- `packages/figma/src/transformers/types/transformer.ts` — `Transformer` type

**`Transformer` signature:**
```typescript
type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
  generateSemanticColorUtilities?: boolean,
  outputMode?: OutputMode,
) => TransformerResult;

interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
}
```

**Format routing table:**
```
StylesheetFormat    → Transformer
'scss'              → transformToScss
'css'               → transformToCss
'tailwind-scss'     → transformToTailwindSassClass
'tailwind-v4'       → transformToTailwindLayerUtilityClassV4
```

---

### 2 — CSS & SCSS Transformers

**Relevant skills:**
- [MaintainCSSTransformer](../skills/maintain-css-transformer.skill.md)
- [MaintainSCSSTransformer](../skills/maintain-scss-transformer.skill.md)

**Source files:**
- `packages/figma/src/transformers/css.transformer.ts`
- `packages/figma/src/transformers/scss.transformer.ts`
- `packages/figma/src/utils/theme-tokens.utils.ts` — `generateCssVariablesWithModes()`, `generateScssVariablesWithModes()`
- `packages/figma/src/utils/units.utils.ts` — `rem()`, `px()`, `em()`

**SCSS variable naming rule:** Variables starting with a digit are prefixed with `v` (e.g. `$v400` not `$400`).

**`rem()` baseline:** 16px. Properties that must NOT convert: `font-weight`, `opacity`, `line-height` (unitless).

---

### 3 — Tailwind Transformers

**Relevant skills:**
- [MaintainTailwindV3Transformer](../skills/maintain-tailwind-v3-transformer.skill.md)
- [MaintainTailwindV4Transformer](../skills/maintain-tailwind-v4-transformer.skill.md)

**Source files:**
- `packages/figma/src/transformers/tailwind/index.ts` — `transformToTailwindSassClass`, `transformToTailwindLayerUtilityClassV4`
- `packages/figma/src/transformers/tailwind/generators.ts` — `Generator`, `GeneratorToken`, `buildDynamicThemeTokens()`
- `packages/figma/src/transformers/tailwind/filters.ts` — `filterStyleTokens()`
- `packages/figma/src/utils/theme-tokens.utils.ts` — `generateThemeDirective()`, `generateSemanticColorUtilities()`, `generateScssLayerUtilitiesFromModes()`

**`@apply` ordering quirk (Tailwind v4):** Tailwind reorders `@apply` utilities by CSS property + numeric value — not authored order. Built-in utilities sort numerically; custom `@utility` blocks sort alphabetically. The intended winning utility must be last under Tailwind's sort order. Full rules: [`docs/declaration-order.md`](../../../docs/declaration-order.md).

**`convertToGeneratorTokens()` — deprecated:** Still called as an interim shim in both Tailwind transformers. Long-term goal: drive class generation directly from the `Selector` shape.

---

### 4 — Naming Context & Variants Middleware

**Relevant skills:**
- [MaintainNamingContext](../skills/maintain-naming-context.skill.md)
- [MaintainVariantsMiddleware](../skills/maintain-variants-middleware.skill.md)

**Source files:**
- `packages/figma/src/utils/create-naming-context/` — `createNamingContext()`, `NamingContext`
- `packages/figma/src/transformers/variants/convert-variant-group-by.ts` — `convertVariantGroupBy()`
- `packages/figma/src/transformers/variants/generate-combinatorial-styles.ts` — `generateCombinatorialStyles()`
- `packages/figma/src/utils/mode.utils.ts` — `normalizeModeName()`

**Naming context configs:**
```typescript
// CSS/SCSS default
{ pathSeparator: '-', afterComponentName: '-', variantEqualSign: '_', betweenVariants: '-' }

// Tailwind v4
{ pathSeparator: '/', afterComponentName: '.', variantEqualSign: '_', betweenVariants: '.' }
```

**Combinatorial vs template parsing:**
- `useCombinatorialParsing: false` → one class/mixin per component, all properties combined
- `useCombinatorialParsing: true` → cross-product of variant states as individual selectors

---

### 5 — Multi-Mode Output

**Source files:**
- `packages/figma/src/utils/theme-tokens.utils.ts` (all multi-mode helpers)
- `packages/figma/src/utils/mode.utils.ts` — `normalizeModeName()`

**Rule:** When `TokenCollection.modes` contains entries, transformers emit:
- A `:root` (CSS) or `@theme` (Tailwind v4) block for the default mode
- `[data-theme='<name>']` blocks for each non-default, non-typography-only mode
- Typography-only modes are filtered by `filterTypographyOnlyModes()`

---

## TODO — Needs Investigation

- [ ] Clarify whether the v4 transformer uses `generateCombinatorialStyles()` or has its own variant handling
- [ ] Document the full `DynamicTheme` interface output shape from `buildDynamicThemeTokens()`
- [ ] Verify `normalizeModeName()` edge cases (digits, slashes, emoji in mode names)

````
