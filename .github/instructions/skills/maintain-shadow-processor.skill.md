# Skill: MaintainShadowProcessor

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the shadow processor without breaking drop-shadow and inner-shadow extraction from Figma effect nodes.

## Implementation

- File: `packages/figma/src/processors/shadow.processor.ts`
- Exported as: `shadowProcessors` (array of `StyleProcessor`)
- Valid node types: `FRAME`, `RECTANGLE`, `INSTANCE`, `ELLIPSE`, `COMPONENT`, `VECTOR`, `STAR`, `POLYGON`

## Properties Emitted

| CSS Property | Figma `bindingKey` |
| ------------ | ------------------ |
| `box-shadow` | `effects`          |

## Input

```typescript
variableTokenMapByProperty: Map<string, VariableToken>;
node: SceneNode;
```

## Output

```typescript
ProcessedValue | null;
// null if node has no shadow effects
```

## Key Internal Functions

```typescript
function convertEffectToBoxShadow(effect: DropShadowEffect | InnerShadowEffect): string | null;
```

## Known Behaviors

- `DROP_SHADOW` → standard `box-shadow: x y blur spread color`
- `INNER_SHADOW` → `box-shadow: inset x y blur spread color`
- Non-shadow effects (blur, layer blur) → skipped, return `null`
- Multiple effects → combined into a comma-separated `box-shadow` value (TBD — see TODO)
- Also imports `convertInsideBordersToBoxShadow` from `border.processor.ts` — relationship TBD

## TODO (Primary Coverage Gap — This Processor Was Entirely Undocumented)

- [ ] Document exact CSS output format for `DROP_SHADOW` (does it include `spread`?)
- [ ] Document exact CSS output format for `INNER_SHADOW`
- [ ] Document how multiple shadow effects on one node are combined
- [ ] Document what `convertEffectToBoxShadow()` returns for unsupported effect types
- [ ] Document variable binding: can shadow colors be variable-bound in Figma? If so, how is `effects` binding key resolved?
- [ ] Document relationship to `convertInsideBordersToBoxShadow()` — is it called here or only in `border.processor.ts`?
- [ ] Add test fixture and snapshot test for shadow extraction
