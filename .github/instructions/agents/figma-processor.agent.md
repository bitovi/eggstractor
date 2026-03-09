# Agent: FigmaProcessorAgent

## Purpose

Owns all `StyleProcessor` implementations. Responsible for extracting CSS property values from individual Figma `SceneNode` objects, routing processors by node type, and resolving variable bindings before falling back to literal values.

## Source Files

- `packages/figma/src/processors/index.ts` — node-type routing via `getProcessorsForNode()`
- `packages/figma/src/processors/background.processor.ts`
- `packages/figma/src/processors/border.processor.ts`
- `packages/figma/src/processors/font.processor.ts`
- `packages/figma/src/processors/layout.processor.ts`
- `packages/figma/src/processors/shadow.processor.ts`
- `packages/figma/src/processors/spacing.processor.ts`
- `packages/figma/src/types/processors.ts` — `StyleProcessor`, `VariableBindings` interfaces

## Skills Used

- [MaintainBackgroundProcessor](../skills/maintain-background-processor.skill.md)
- [MaintainFontProcessor](../skills/maintain-font-processor.skill.md)
- [MaintainLayoutProcessor](../skills/maintain-layout-processor.skill.md)
- [MaintainBorderProcessor](../skills/maintain-border-processor.skill.md)
- [MaintainSpacingProcessor](../skills/maintain-spacing-processor.skill.md)
- [MaintainShadowProcessor](../skills/maintain-shadow-processor.skill.md)

## Domain Knowledge

### Node-Type Routing

```
TEXT nodes       → fontProcessors only
FRAME, RECTANGLE,
INSTANCE, ELLIPSE,
COMPONENT, VECTOR,
STAR, POLYGON    → backgroundProcessors + layoutProcessors + borderProcessors
                   + shadowProcessors + spacingProcessors
other            → [] (empty — skip)
```

Actual implementation (`processors/index.ts`):

```typescript
export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case 'TEXT':
      return TEXT_PROCESSORS;
    case 'FRAME':
    case 'RECTANGLE':
    case 'INSTANCE':
    case 'ELLIPSE':
    case 'COMPONENT':
    case 'VECTOR':
    case 'STAR':
    case 'POLYGON':
      return LAYOUT_PROCESSORS;
    default:
      return [];
  }
}
```

### Processor Array Export Pattern

Named top-level exports used by the router:

| Exported Constant   | Component Arrays                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `TEXT_PROCESSORS`   | `fontProcessors`                                                                                                       |
| `LAYOUT_PROCESSORS` | `backgroundProcessors`, `layoutProcessors`, `borderProcessors`, `shadowProcessors`, `spacingProcessors` (concatenated) |

### Variable Binding Resolution Order

Every processor checks its `bindingKey` against `variableTokenMapByProperty` **before** reading the literal node value. If a variable alias is found, it becomes the token's `VariableToken`; otherwise the literal value is used.

Canonical pattern inside a `process()` method:

```typescript
const fillVariable = variableTokenMapByProperty.get('fills');
if (fillVariable) {
  return {
    value: fillVariable.value,
    rawValue: fillVariable.rawValue,
  };
}
// fall through to literal value extraction
```

### `StyleProcessor` Interface

```typescript
interface StyleProcessor {
  property: string; // CSS property name
  bindingKey: keyof VariableBindings | undefined; // Figma variable binding lookup key
  process: (
    variableTokenMapByProperty: Map<string, VariableToken>,
    node: SceneNode,
  ) => Promise<ProcessedValue | null>; // null = property not applicable to this node
}
```

### `ProcessedValue` Shape

```typescript
interface ProcessedValue {
  value: string | null;
  rawValue: string | null;
  valueType?: string | null;
  warnings?: string[];
  errors?: string[];
}
```

**Warning/Error tracking pattern** — collect into `Set`s to deduplicate, then spread onto the result:

```typescript
const result: ProcessedValue = {
  warnings: warningsSet.size > 0 ? Array.from(warningsSet) : undefined,
  errors: errorsSet.size > 0 ? Array.from(errorsSet) : undefined,
  value: null,
  rawValue: null,
};
```

### Known Behaviors

- `border.processor.ts` also handles inside-border → `box-shadow` conversion via `convertInsideBordersToBoxShadow()`
- `layout.processor.ts` supports both modern (`layoutSizingHorizontal`/`layoutSizingVertical`) and legacy (`primaryAxisSizingMode`/`counterAxisSizingMode`) Figma API; legacy triggers a warning
- `shadow.processor.ts` uses `bindingKey: 'effects'` and handles both `DROP_SHADOW` and `INNER_SHADOW` effect types

### Shadow Processor Detail

| Field               | Value                                                           |
| ------------------- | --------------------------------------------------------------- |
| `property`          | `'box-shadow'`                                                  |
| `bindingKey`        | `'effects'`                                                     |
| Figma types handled | `DROP_SHADOW`, `INNER_SHADOW`                                   |
| Ignored types       | `LAYER_BLUR`, `BACKGROUND_BLUR` (filtered before processing)    |
| Visibility guard    | Effects with `visible === false` or `color.a === 0` are skipped |

### Shadow Processor CSS Output Format

`shadow.processor.ts` emits `box-shadow` in this format per effect:

```
[inset] <offset-x>px <offset-y>px <blur-radius>px [<spread>px] rgba(r, g, b, a)
```

- `INNER_SHADOW` → `inset` keyword prepended; `DROP_SHADOW` → no keyword.
- Multiple effects joined with `, `.
- `convertEffectToBoxShadow()` only ever receives pre-filtered `DROP_SHADOW`/`INNER_SHADOW` values — caller filters before invoking. In practice it always returns a CSS string (never `null`) for those types.

### `box-shadow` Conflict Resolution (inside borders + shadow effects)

Two processors can both emit `box-shadow`; the rule is:

| Situation                                    | Who emits `box-shadow`                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| INSIDE stroke, **no** shadow effects         | `border.processor.ts` handles it alone                                                                                                                                                           |
| INSIDE stroke **and** visible shadow effects | `border.processor.ts` returns `null` (defers); `shadow.processor.ts` calls `convertInsideBordersToBoxShadow()`, prepends the inset border value, then appends shadow values — single declaration |
| Shadow effects only (no INSIDE stroke)       | `shadow.processor.ts` handles it alone; `border.processor.ts` `box-shadow` entry returns `null`                                                                                                  |

### Background Processor Code Example

Full example of `backgroundProcessors` illustrating the variable-binding-first pattern:

```typescript
export const backgroundProcessors: StyleProcessor[] = [
  {
    property: 'background',
    bindingKey: 'fills',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node: SceneNode,
    ): Promise<ProcessedValue | null> => {
      if ('fills' in node && Array.isArray(node.fills)) {
        const visibleFills = node.fills.filter((fill) => fill.visible);
        if (!visibleFills.length) return null;

        const backgrounds = await Promise.all(
          visibleFills.map(async (fill: Paint) => {
            if (fill.type === 'SOLID') {
              const fillVariable = variableTokenMapByProperty.get('fills');
              if (fillVariable) {
                return { value: fillVariable.value, rawValue: fillVariable.rawValue };
              }

              const { r, g, b } = fill.color;
              const a = fill.opacity ?? 1;
              const value = rgbaToString(r, g, b, a);
              return { value, rawValue: value };
            }
            return null;
          }),
        );

        const validBackgrounds = backgrounds.filter((b): b is NonNullable<typeof b> => b !== null);
        if (validBackgrounds.length > 0) {
          return {
            value: validBackgrounds.map((b) => b.value).join(', '),
            rawValue: validBackgrounds.map((b) => b.rawValue).join(', '),
          };
        }
      }
      return null;
    },
  },
];
```

## TODO — Needs Investigation

- [ ] Document `opacity` processor behavior when variable binding is absent
- [ ] Document all properties emitted by `font.processor.ts` (full list beyond what's in skeleton)
- [ ] Document `border-radius` handling: is it per-corner or shorthand?
