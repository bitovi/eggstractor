---
name: maintain-variants-middleware
description: Provides an agent with the knowledge needed to safely modify, debug, or extend the variants middleware without breaking combinatorial style expansion or selector generation.
---

# Skill: MaintainVariantsMiddleware

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the variants middleware without breaking combinatorial style expansion or selector generation.

## Implementation

- File: `packages/figma/src/transformers/variants/convert-variant-group-by.ts` — `convertVariantGroupBy()`
- File: `packages/figma/src/transformers/variants/generate-combinatorial-styles.ts` — `generateCombinatorialStyles()`
- File: `packages/figma/src/transformers/variants/index.ts` — re-exports

## Input

```typescript
tokenCollection: TokenCollection;
styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>;
transform: (token: StyleToken) => Record<string, string>; // property→value mapper
namingContext: NamingContext;
useCombinatorialParsing: boolean; // if false, returns tokens as-is without combinatorial expansion
```

## Output

```typescript
{
  selectors: ({ key: string } & StylesForVariantsCombination)[];
  warnings: string[];
}
```

## Key Types

```typescript
type StylesForVariantsCombination = {
  styles: Record<string, string>; // CSS property → value
  variants: Record<string, string>; // variant name → variant value (active)
  path: PathNode[];
  tokens?: StyleToken[];
};
```

## Key Behaviors

- Groups `StyleToken` objects by their variant combination key
- Passes groups through `generateCombinatorialStyles()` to produce the cross-product
- `generateCombinatorialStyles()` uses `shallowEqual`, `splitByMatch`, `removeByComparison` internally
- `updatePaddingStylesBasedOnBorder()` applied to adjust padding when borders affect layout
- Returns flat list of `selectors` — each is a unique property+variant combination → CSS selector

## TODO (Significant Coverage Gap — Variants Middleware Was Undocumented)

- [ ] Document what "combinatorial parsing" means in user-facing terms (what problem it solves)
- [ ] Document `generateCombinatorialStyles()` algorithm — how does it compute the cross-product?
- [ ] Document `StyleNode` internal type and how `possibleVariants` differs from `variants`
- [ ] Document `shallowEqual()` implementation and why it's needed for deduplication
- [ ] Document `splitByMatch()` and `removeByComparison()` purposes
- [ ] Document how `namingContext.createName()` is called with combinatorial `variants` parameter
- [ ] Document what `useCombinatorialParsing: false` returns vs. `true` (template vs. expanded)
- [ ] Document `convertToGeneratorTokens()` deprecation — what replaced it in the v3 flow?
