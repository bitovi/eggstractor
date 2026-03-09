# Skill: MaintainFontProcessor

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the font processor without breaking typography extraction from Figma TEXT nodes.

## Implementation

- File: `packages/figma/src/processors/font.processor.ts`
- Exported as: `fontProcessors` (array of `StyleProcessor`)
- Valid node types: `TEXT` only

## Properties Emitted

| CSS Property      | Figma `bindingKey`                            |
| ----------------- | --------------------------------------------- |
| `color`           | `fills`                                       |
| `font-family`     | `fontFamily`                                  |
| `font-size`       | `fontSize`                                    |
| `font-weight`     | `fontWeight`                                  |
| `font-style`      | `fontStyle`                                   |
| `line-height`     | `lineHeight`                                  |
| `letter-spacing`  | `letterSpacing`                               |
| `text-align`      | _(none — derived from `textAlignHorizontal`)_ |
| `text-decoration` | _(binding key TBD)_                           |

## Input

```typescript
variableTokenMapByProperty: Map<string, VariableToken>;
node: SceneNode; // expected to be TEXT type
```

## Output

```typescript
ProcessedValue | null;
```

## Known Behaviors

- `font-size` → converted to `rem` via `rem()` utility
- `line-height` with symbol value (Figma `MIXED`) → `isSymbol()` guard, skipped
- `text-align` → derived from `textAlignHorizontal` string, no variable binding
- `font-weight` → numeric value, no `rem` conversion

## TODO

- [ ] Document full list of properties (beyond what is in this skeleton)
- [ ] Document `letter-spacing` unit handling (Figma uses percent vs px — how normalized?)
- [ ] Document `line-height` output when value is a ratio vs. px
- [ ] Document `text-decoration` bindingKey
- [ ] Document color extraction for text (same as background or different?)
