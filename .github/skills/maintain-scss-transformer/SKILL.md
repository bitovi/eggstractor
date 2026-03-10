---
name: maintain-scss-transformer
description: Provides an agent with the knowledge needed to safely modify, debug, or extend the SCSS transformer without breaking variable declarations, mixin output, or mode-aware CSS custom property generation.
---

# Skill: MaintainSCSSTransformer

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the SCSS transformer without breaking variable declarations, mixin output, or mode-aware CSS custom property generation.

## Implementation

- File: `packages/figma/src/transformers/scss.transformer.ts`
- Exported as: `transformToScss: Transformer`
- Support: `packages/figma/src/utils/theme-tokens.utils.ts` — `generateScssVariablesWithModes()`, `generateScssLayerUtilitiesFromModes()`
- Support: `packages/figma/src/utils/create-naming-context/` — `createNamingContext()`

## Input

```typescript
tokens: TokenCollection
useCombinatorialParsing: boolean
generateSemanticColorUtilities?: boolean
outputMode?: OutputMode   // 'variables' | 'components' | 'all'
```

## Output

```typescript
TransformerResult { result: string; warnings: string[]; errors: string[]; }
// result: full SCSS string
```

## Key Behaviors

- `VariableToken` objects → SCSS `$variable-name: value;` declarations
- `StyleToken` objects grouped by component → `@mixin component-name { ... }` blocks
- Variable names starting with digit → prefixed with `v` (e.g., `$v400`)
- Numeric dimension values → converted via `rem()`
- `generateSemanticColorUtilities: true` → additional utility layer (exact format TBD)
- `useCombinatorialParsing: true` → tokens passed through `convertVariantGroupBy()` first
- Multi-mode variables → `generateScssVariablesWithModes()` produces CSS custom property blocks

## SCSS Variable Naming

```typescript
const getSCSSVariableName = (variableName: string): string
// If starts with digit: '$v' + name
// Otherwise: '$' + name
```

## Naming Context Config (SCSS)

Uses default config: `pathSeparator: '-'`, `afterComponentName: '-'`, `variantEqualSign: '_'`, `betweenVariants: '-'`

## TODO

- [ ] Document the full SCSS output structure (variable block → mixin block → utility block order)
- [ ] Document `getMixinPropertyAndValue()` — how does it use `primitiveVariables` map?
- [ ] Document `generateScssLayerUtilitiesFromModes()` — what does it produce and when is it called?
- [ ] Document `outputMode` effect — does `'variables'` suppress mixin generation?
- [ ] Document deduplication: `deduplicateMessages()` usage on warnings/errors
