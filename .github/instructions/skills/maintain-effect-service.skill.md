# Skill: MaintainEffectService

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the effect service without breaking effect style token collection.

## Implementation

- File: `packages/figma/src/services/effect.service.ts`
- Key export: `collectAllFigmaEffectStyles(collection, onProgress)`
- Internal: `createEffectStyleToken(effectStyle: EffectStyle) → VariableToken | null`

## Input

```typescript
collection: TokenCollection          // mutated in place
onProgress: (percent: number, message: string) => void
```

## Output

Mutates `collection.tokens`. Returns `Promise<void>`.

## Token Type Produced

`VariableToken` with:

- `type: 'variable'`
- `name` derived from `effectStyle.name` via `sanitizeName()`
- `property` inferred from effect type (e.g., `box-shadow`)
- `value` as CSS string

## Key Behaviors

- `figma.getLocalEffectStyles()` → array of `EffectStyle`
- Each `EffectStyle` → `createEffectStyleToken()` → appended to `collection.tokens` if non-null
- Returns `null` for unsupported effect types

## TODO

- [ ] Document which Figma `EffectStyle` types are supported (`DROP_SHADOW`, `INNER_SHADOW`, `LAYER_BLUR`, `BACKGROUND_BLUR`)
- [ ] Document how multi-effect styles (style with multiple effects) are handled — one token or many?
- [ ] Document CSS output format for blur effects
- [ ] Document how `sanitizeName()` transforms the Figma effect style name
- [ ] Confirm whether effect style tokens appear in the same `collection.tokens` array as node tokens or a separate field
