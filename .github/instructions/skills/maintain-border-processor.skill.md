# Skill: MaintainBorderProcessor

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the border processor without breaking border, outline, and inside-stroke-to-box-shadow extraction from Figma nodes.

## Implementation

- File: `packages/figma/src/processors/border.processor.ts`
- Exported as: `borderProcessors` (array of `StyleProcessor`)
- Also exports: `convertInsideBordersToBoxShadow()` (used by `shadow.processor.ts`)
- Valid node types: `FRAME`, `RECTANGLE`, `INSTANCE`, `ELLIPSE`, `COMPONENT`, `VECTOR`, `STAR`, `POLYGON`

## Properties Emitted

| CSS Property    | Figma `bindingKey`                       |
| --------------- | ---------------------------------------- |
| `border`        | `strokes`                                |
| `border-top`    | `strokes`                                |
| `border-right`  | `strokes`                                |
| `border-bottom` | `strokes`                                |
| `border-left`   | `strokes`                                |
| `outline`       | _(none)_                                 |
| `box-shadow`    | _(none — from inside border conversion)_ |

## Input

```typescript
variableTokenMapByProperty: Map<string, VariableToken>;
node: SceneNode;
```

## Output

```typescript
ProcessedValue | null;
```

## Key Internal Types

```typescript
interface BorderWeights {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
interface BorderColor {
  value: string;
  rawValue: string;
  variable?: VariableToken;
}
interface BorderWidth {
  value: string;
  rawValue: string;
  variable?: VariableToken;
}
```

## Known Behaviors

- Inside-positioned strokes (Figma `strokeAlign: 'INSIDE'`) → converted to `box-shadow` inset via `convertInsideBordersToBoxShadow()`
- Outside-positioned strokes → `outline` property
- Center-positioned strokes → `border` shorthand
- Per-side borders when weights differ → individual `border-top/right/bottom/left` properties

## TODO

- [ ] Document `convertInsideBordersToBoxShadow()` output format and how it differs from direct `box-shadow` extraction in `shadow.processor.ts`
- [ ] Document how stroke color variable binding is resolved
- [ ] Document behavior when node has multiple strokes
- [ ] Document `outline` output format (does it include `outline-offset`?)
- [ ] Document `BorderSideConfig` usage for per-side border generation
- [ ] Clarify `box-shadow` collision: border processor vs. shadow processor — which wins?
