# Skill: MaintainSpacingProcessor

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the spacing processor without breaking padding extraction and shorthand collapsing logic.

## Implementation

- File: `packages/figma/src/processors/spacing.processor.ts`
- Exported as: `spacingProcessors` (array of `StyleProcessor`)
- Valid node types: `FRAME`, `RECTANGLE`, `INSTANCE`, `ELLIPSE`, `COMPONENT`, `VECTOR`, `STAR`, `POLYGON`

## Properties Emitted

- `padding` (shorthand when all sides equal)
- Individual sides when they differ (exact property names TBD — see TODO)

## Input

```typescript
variableTokenMapByProperty: Map<string, VariableToken>;
node: SceneNode;
```

## Output

```typescript
ProcessedValue | null;
// null if node has no padding (e.g., paddingTop/Right/Bottom/Left all === 0)
```

## Key Internal Types

```typescript
interface NodeWithPadding {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}
interface PaddingValues {
  top: string;
  right: string;
  bottom: string;
  left: string;
}
```

## Known Behaviors

- `allEqual([top, right, bottom, left])` → single `padding` shorthand emitted
- Values converted to `rem` via units utility
- `hasNodePadding(node)` type guard used before accessing padding properties

## TODO

- [ ] Confirm whether per-side padding is emitted as `padding-top/right/bottom/left` or other property names
- [ ] Document variable binding keys for individual padding sides (`paddingTop`, `paddingRight`, etc.)
- [ ] Document behavior when `paddingTop === paddingBottom` but sides differ (two-value shorthand?)
- [ ] Document interaction with `updatePaddingStylesBasedOnBorder()` in transformer utils
- [ ] Document what `allEqual()` returns for mixed string values (e.g., `'0rem'` vs `'0'`)
