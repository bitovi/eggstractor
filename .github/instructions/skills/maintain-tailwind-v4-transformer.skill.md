# Skill: MaintainTailwindV4Transformer

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the Tailwind v4 transformer without breaking @layer utility output or the @apply ordering contract.

## Implementation

- File: `packages/figma/src/transformers/tailwind/index.ts`
- Exported as: `transformToTailwindLayerUtilityClassV4: Transformer`

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
// result: CSS with @layer utilities { .class-name { @apply ...; } } blocks
```

## Key Behaviors

- Produces `@layer utilities` blocks for Tailwind v4 custom utility classes
- Naming context uses `tailwind4NamingConfig`: `pathSeparator: '/'`, `afterComponentName: '.'`, `variantEqualSign: '_'`, `betweenVariants: '.'`
- **`@apply` ordering quirk**: Tailwind v4 reorders `@apply` utilities internally — built-in utilities sort by property/numeric; custom utilities sort alphabetically. This is NOT authored-order. Documented in `docs/declaration-order.md`.
- `useCombinatorialParsing: true` → variant middleware applied before output

## Tailwind v4 Naming Context

```typescript
const tailwind4NamingConfig = {
  env: 'tailwind-v4',
  delimiters: {
    pathSeparator: '/',
    afterComponentName: '.',
    variantEqualSign: '_',
    betweenVariants: '.',
  },
};
```

## TODO (Primary Coverage Gap — `@apply` ordering affects correctness)

- [ ] Document exact `@layer utilities` block structure produced
- [ ] Document how `outputMode` affects v4 output
- [ ] Document whether v4 transformer uses same generator functions as v3 or different approach
- [ ] Document how CSS variable references (`var(--...)`) appear in v4 utility declarations
- [ ] Document known cases where `@apply` reordering causes incorrect output and mitigation strategies
- [ ] Document how `generateSemanticColorUtilities` changes v4 output
