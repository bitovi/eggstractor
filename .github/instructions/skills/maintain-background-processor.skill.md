# Skill: MaintainBackgroundProcessor

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the background processor without breaking color and opacity extraction from Figma nodes.

## Implementation

- File: `packages/figma/src/processors/background.processor.ts`
- Exported as: `backgroundProcessors` (array of `StyleProcessor`)
- Properties emitted: `background`, `opacity`
- Valid node types: `FRAME`, `RECTANGLE`, `INSTANCE`, `ELLIPSE`, `COMPONENT`, `VECTOR`, `STAR`, `POLYGON`

## Input

```typescript
variableTokenMapByProperty: Map<string, VariableToken>; // pre-resolved variable bindings
node: SceneNode; // Figma node to extract from
```

## Output

```typescript
ProcessedValue | null;
// null = property not applicable (e.g., node has no fills)
// value = resolved CSS color string (hex or rgba)
// rawValue = original Figma color representation
```

## Binding Keys

- `background` → `bindingKey: 'fills'`
- `opacity` → `bindingKey: 'opacity'`

## Known Behaviors

- Solid fill with `a === 1` → hex string `'#rrggbb'`
- Solid fill with `a < 1` → `'rgba(r, g, b, a)'`
- Multiple fills → behavior TBD (see TODO)
- Gradient fills → `GradientValue` shape (see `packages/figma/src/types/gradients.ts`)

## TODO

- [ ] Document how multiple fills are handled (first fill? merged? error?)
- [ ] Document gradient fill extraction and CSS output format
- [ ] Document variable-bound fill resolution path (how `variableTokenMapByProperty` is checked)
- [ ] Document what `rawValue` contains for gradient fills
