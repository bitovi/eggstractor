# Skill: MaintainLayoutProcessor

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the layout processor without breaking flexbox, sizing, and border-radius extraction from Figma layout nodes.

## Implementation

- File: `packages/figma/src/processors/layout.processor.ts`
- Utility: `packages/figma/src/utils/layout-sizing.utils.ts`
- Exported as: `layoutProcessors` (array of `StyleProcessor`)
- Valid node types: `FRAME`, `RECTANGLE`, `INSTANCE`, `ELLIPSE`, `COMPONENT`, `VECTOR`, `STAR`, `POLYGON`

## Properties Emitted

| CSS Property      | Figma `bindingKey`                   |
| ----------------- | ------------------------------------ |
| `display`         | _(none — derived from `layoutMode`)_ |
| `flex-direction`  | _(none)_                             |
| `justify-content` | _(none)_                             |
| `align-items`     | _(none)_                             |
| `gap`             | `itemSpacing`                        |
| `flex-wrap`       | _(none)_                             |
| `width`           | _(none)_                             |
| `height`          | _(none)_                             |
| `min-width`       | `minWidth`                           |
| `max-width`       | `maxWidth`                           |
| `min-height`      | `minHeight`                          |
| `max-height`      | `maxHeight`                          |
| `border-radius`   | `cornerRadius`                       |

## Input

```typescript
variableTokenMapByProperty: Map<string, VariableToken>;
node: SceneNode;
```

## Output

```typescript
ProcessedValue | null;
// null if node has no auto-layout (display, flex-direction, etc. omitted for non-auto-layout nodes)
```

## Known Behaviors

- Auto-layout nodes (`layoutMode: 'HORIZONTAL' | 'VERTICAL'`) → `display: flex` emitted
- Non-auto-layout nodes → `display`, `flex-direction`, etc. return `null`
- Modern Figma API: `layoutSizingHorizontal` / `layoutSizingVertical` (values: `FIXED`, `HUG`, `FILL`)
- Legacy Figma API: `primaryAxisSizingMode` / `counterAxisSizingMode` — triggers warning via `warnAboutLegacyApi()`
- Dimension values → converted to `rem` via `rem()` utility
- `HUG` sizing → `width: fit-content` or similar
- `FILL` sizing → `width: 100%` or similar

## TODO

- [ ] Document exact CSS output for each `SizingMode` value (`FIXED`, `HUG`, `FILL`) for both axes
- [ ] Document `border-radius` — shorthand or per-corner? What if corners differ?
- [ ] Document `layoutWrap: 'WRAP'` → `flex-wrap: wrap` mapping
- [ ] Document how `absoluteBoundingBox` is used vs. explicit width/height properties
- [ ] Document legacy API warning message format
