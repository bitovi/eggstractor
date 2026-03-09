# Agent: TokenCollectionAgent

## Purpose

Orchestrates the full Figma token collection pipeline. Drives page/component traversal, delegates per-node extraction to processors, collects Figma local variables and effect styles, and assembles the final `TokenCollection` object that all transformers consume.

## Source Files

- `packages/figma/src/services/collection.service.ts` — `collectTokens()`, `getFlattenedValidNodes()`, `shouldSkipInstanceTokenGeneration()`
- `packages/figma/src/services/token.service.ts` — `extractNodeToken()`, `extractComponentToken()`, `extractComponentSetToken()`, `extractInstanceSetToken()`
- `packages/figma/src/services/variable.service.ts` — `collectPrimitiveVariables()`, `collectSemanticColorVariables()`, `collectBoundVariable()`
- `packages/figma/src/services/effect.service.ts` — `collectAllFigmaEffectStyles()`
- `packages/figma/src/types/tokens.ts` — `TokenCollection`, `StyleToken`, `VariableToken`, all token types

## Skills Used

- [MaintainVariableService](../skills/maintain-variable-service.skill.md)
- [MaintainEffectService](../skills/maintain-effect-service.skill.md)
- [MaintainVariableBindingResolution](../skills/maintain-variable-binding-resolution.skill.md)
- Delegates per-node extraction to **FigmaProcessorAgent**

## Domain Knowledge

### `TokenCollection` Shape

```typescript
interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
  components: Record<ComponentToken['id'], ComponentToken>;
  componentSets: Record<ComponentSetToken['id'], ComponentSetToken>;
  instances: Record<InstanceToken['id'], InstanceToken>;
  modes?: Map<string, string>;
}
```

### Traversal Order

1. Collect primitive variables from all local `VariableCollection` objects via `collectPrimitiveVariables(collection, onProgress)` — also populates `collection.modes`
2. Collect semantic color variables (alias chains resolved) via `collectSemanticColorVariables(collection, onProgress)`
3. Collect all Figma effect styles via `collectAllFigmaEffectStyles(collection, onProgress)`
4. Call `getFlattenedValidNodes(page)` across all pages to build a flat `allValidNodes` list; warning tokens for component-set duplicates (from `detectComponentSetDuplicates()`) are collected here and pushed to `collection.tokens`
5. For each node in `allValidNodes`, call `getProcessorsForNode()` and run each processor via `extractNodeToken()`
6. For `COMPONENT_SET` nodes: call `extractComponentSetToken()`, store in `collection.componentSets`
7. For `COMPONENT` nodes: call `extractComponentToken()`, store in `collection.components`
8. For `INSTANCE` nodes: call `extractInstanceSetToken()`, store in `collection.instances`; then check `shouldSkipInstanceTokenGeneration()` — if `true`, return early for that node

### Progress Reporting

`collectTokens(onProgress, outputMode)` calls `onProgress(percent, message)` throughout. Max progress capped at `MAX_PROGRESS_PERCENTAGE` (95) — the remaining 5% is reserved for the transform step.

| Phase                       | Percentage                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| Start (load pages)          | 0%                                                                |
| Counting nodes              | 5%                                                                |
| Node processing start       | 10%                                                               |
| Node processing loop        | `10 + floor((processed/total) × (MAX_PROGRESS_PERCENTAGE − 10))`% |
| Variable-only mode complete | 95%                                                               |

Progress updates are throttled: UI is yielded (via `delay(0)`) at most every 200 ms.

### `OutputMode` Effect

```typescript
type OutputMode = 'variables' | 'components' | 'all';
```

- `'variables'` — collects only variable/effect tokens, skips component/instance node traversal
- `'components'` — collects only style tokens from nodes, skips variable collection
- `'all'` — full collection

### Error and Warning Tokens

- Duplicate component set variant names → `StyleToken` with `warnings` array injected into collection
- Node processing failure → `StyleToken` with `errors` array

### `VariableToken` Discrimination

```typescript
type VariableToken = StandardVariableToken | ModeVariableToken;
```

`StandardVariableToken` — used when a variable has exactly one mode:

```typescript
export interface StandardVariableToken extends BaseToken {
  type: 'variable';
  value: string; // transformer-agnostic reference (e.g. 'color-primary')
  rawValue: string; // actual CSS value (e.g. '#0080ff')
  primitiveRef?: string; // for semantic tokens: the primitive name it references
  metadata?: {
    variableId?: string;
    variableName?: string;
    variableTokenType?: 'primitive' | 'semantic';
  };
}
```

`ModeVariableToken` — used when a variable has multiple modes:

```typescript
export interface ModeVariableToken extends BaseToken {
  type: 'variable';
  value: string;
  rawValue: string; // default mode value
  primitiveRef?: string; // default mode primitive reference
  modeId: string; // default mode ID (e.g. '2002:0')
  modeName: string; // human-readable default mode name
  modes: string[]; // all mode IDs for this variable
  modeValues: Record<string, string>; // modeId → resolved value
  modePrimitiveRefs?: Record<string, string>; // modeId → primitive var name (semantic only)
  metadata?: {
    variableId?: string;
    variableName?: string;
    variableTokenType?: 'primitive' | 'semantic';
    modeId?: string;
    modeName?: string;
  };
}
```

Key invariants:

- `rawValue` always contains the **default (first) mode** value.
- `ModeVariableToken.modeValues` is always present and non-optional when >1 modes.
- Keys in `modeValues` / `modePrimitiveRefs` are Figma's internal mode IDs (e.g. `"2002:0"`).

The discriminating condition in `variable.service.ts`: return `ModeVariableToken` when the variable collection has more than one mode, otherwise `StandardVariableToken`.

### `collectAllFigmaVariables()` (in `variable.service.ts`)

Low-level helper that fetches all local Figma variables and their collections. Not called directly by `collectTokens()`; instead `collectPrimitiveVariables` and `collectSemanticColorVariables` use it internally.

```typescript
export async function collectAllFigmaVariables(): Promise<{
  tokens: VariableToken[];
  variables: Variable[];
  collections: VariableCollection[];
}> {
  const collections = await figma.variables.getLocalVariableCollections();
  const allTokens: VariableToken[] = [];

  for (const collection of collections) {
    const variables = await Promise.all(
      collection.variableIds.map((id) => figma.variables.getVariableById(id)),
    );

    for (const variable of variables) {
      if (variable) {
        const token = await extractVariableToken(variable, collection);
        if (token) {
          allTokens.push(token);
        }
      }
    }
  }

  return { tokens: allTokens, variables: allVariables, collections };
}
```

### `collectTokens()` Reference Implementation

```typescript
export async function collectTokens(
  onProgress: (progress: number, message: string) => void,
  outputMode: OutputMode = 'all',
): Promise<Readonly<TokenCollection>> {
  const collection: TokenCollection = {
    tokens: [],
    components: {},
    componentSets: {},
    instances: {},
  };

  // Always load all pages first
  await figma.loadAllPagesAsync();

  // Phase 1: variable & effect collection (skipped for 'components' mode)
  if (outputMode !== 'components') {
    await collectPrimitiveVariables(collection, onProgress); // also populates collection.modes
    await collectSemanticColorVariables(collection, onProgress);
    await collectAllFigmaEffectStyles(collection, onProgress);
  }

  // Phase 2: node traversal (skipped for 'variables' mode)
  if (outputMode === 'variables') {
    onProgress(MAX_PROGRESS_PERCENTAGE, 'Variable collection complete!');
    return collection;
  }

  const allPageResults = figma.root.children.map((page) => getFlattenedValidNodes(page));
  const allValidNodes = allPageResults.flatMap((r) => r.validNodes);
  collection.tokens.push(...allPageResults.flatMap((r) => r.warningTokens));

  for (const node of allValidNodes) {
    await processNode(node); // increments progress within 10–MAX_PROGRESS_PERCENTAGE
  }

  return collection;
}
```

`MAX_PROGRESS_PERCENTAGE` is `95`. Node-loop progress formula: `10 + floor((processedNodes / totalNodes) × 85)`. The final 5% is owned by the transform/code-generation phase.

### Mode Population in `collectPrimitiveVariables`

`collection.modes` (a `Map<modeId, modeName>`) is populated during primitive variable collection:

```typescript
// For each VariableCollection:
const modes = getModesFromCollection(varCollection); // reads collection.modes[] from Figma API
for (const mode of modes) {
  collection.modes.set(mode.modeId, mode.modeName);
}
```

`getModesFromCollection(collection: VariableCollection): ModeInfo[]` wraps `collection.modes.map(m => ({ modeId: m.modeId, modeName: m.name }))`.

### `createPrimitiveVariableToken` — How `modeValues` Is Built

Inside `variable.service.ts`, `createPrimitiveVariableToken` iterates all modes to populate `modeValues`:

```typescript
const modes = getModesFromCollection(collection);
const defaultMode = modes[0];
const modeValues: Record<string, string> = {};

for (const mode of modes) {
  const value = variable.valuesByMode[mode.modeId];
  if (!value) continue;
  // Extract raw value based on variable type (COLOR, FLOAT, STRING)
  modeValues[mode.modeId] = modeRawValue.toLowerCase();
}

return {
  // ... other fields
  rawValue: defaultModeRawValue, // default mode value
  modeValues: Object.keys(modeValues).length > 1 ? modeValues : undefined,
  metadata: { modeId: defaultMode.modeId, modeName: defaultMode.modeName },
};
```

`modeValues` is only set when there are multiple modes (>1) — optimizes the common single-mode case.

### `extractModesFromTokens` Fallback

If `collection.modes` is unavailable, mode names are reconstructed from token metadata:

```typescript
function extractModesFromTokens(tokens: VariableToken[]): Map<string, string> {
  const modesMap = new Map<string, string>();
  for (const token of tokens) {
    if (token.modeValues) {
      for (const modeId of Object.keys(token.modeValues)) {
        if (!modesMap.has(modeId)) {
          if (token.metadata?.modeId === modeId && token.metadata?.modeName) {
            modesMap.set(modeId, normalizeModeName(token.metadata.modeName));
          } else {
            modesMap.set(modeId, `mode-${modeId}`);
          }
        }
      }
    }
  }
  return modesMap;
}
```

### Multi-Mode Test Fixture

```typescript
const multiModeToken: VariableToken = {
  type: 'variable',
  name: 'color-primary',
  property: 'color',
  value: '$color-primary',
  rawValue: '#0080ff', // default mode
  valueType: null,
  path: [],
  modeValues: {
    'mode-1': '#0080ff', // light
    'mode-2': '#0066cc', // dark
  },
  metadata: {
    variableId: 'var-1',
    variableName: 'Color/Primary',
    variableTokenType: 'primitive',
    modeId: 'mode-1',
    modeName: 'light',
  },
};

const collection: TokenCollection = {
  tokens: [multiModeToken],
  components: {},
  componentSets: {},
  instances: {},
  modes: new Map([
    ['mode-1', 'light'],
    ['mode-2', 'dark'],
  ]),
};
```

### Multi-Mode Best Practices

1. **Always populate `collection.modes`** — ensures accurate mode names in CSS output.
2. **Use semantic mode names** — match designer intentions (e.g. `light`, `dark`, `high-contrast`).
3. **Test with 2+ modes** — verify `modeValues` is populated and transformers consume it.
4. **Handle single-mode gracefully** — tokens without `modeValues` must work seamlessly.
5. **Preserve mode order** — the first mode in the Figma collection is always treated as the default.

### `getFlattenedValidNodes` Contract

```typescript
export function getFlattenedValidNodes(node: BaseNode): {
  validNodes: BaseNode[];
  warningTokens: StyleToken[];
};
```

Nodes are excluded when they:

- Start with `.` or `_` (designer-marked private/hidden)
- Have more than one fill (multi-fill not supported)
- Have any gradient fill (gradient not supported)

Warning tokens are emitted immediately for component-set variant name duplicates (detected by `detectComponentSetDuplicates()`).

### `shouldSkipInstanceTokenGeneration` Exact Condition

```typescript
export function shouldSkipInstanceTokenGeneration(
  node: InstanceNode,
  instanceToken: InstanceToken,
  collection: TokenCollection,
): boolean {
  if (instanceToken.componentNode) {
    const baseComponentId = instanceToken.componentNode.id;
    const baseComponent = collection.components[baseComponentId];
    if (baseComponent) {
      console.info(
        `🎯 Instance "${node.name}" duplicates component "${baseComponentId}" - skipping tokens`,
      );
      return true; // duplicate — base component already processed
    }
  }
  return false;
}
```

Instances are skipped when their `componentNode.id` already exists in `collection.components`, meaning the base component was encountered earlier in traversal and tokens are not regenerated for the instance.

### `detectComponentSetDuplicates` (in `collection.service.ts`)

```typescript
export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const duplicateNames: string[] = [];
  const seenVariants = new Set<string>();

  if (!('children' in componentSetNode)) {
    return { duplicateNames, hasDuplicates: false };
  }

  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      const variantName = child.name || 'unnamed';
      if (seenVariants.has(variantName)) {
        duplicateNames.push(variantName);
      } else {
        seenVariants.add(variantName);
      }
    }
  }

  return { duplicateNames, hasDuplicates: duplicateNames.length > 0 };
}
```

Called inside `getFlattenedValidNodes()`. When duplicates are found, a warning `StyleToken` is created and added to `warningTokens`; the component set is **not** added to `validNodes`.

## TODO — Needs Investigation

- [ ] Document how `collectBoundVariable()` handles alias chains (e.g., variable → variable → primitive)
- [ ] Document `collectSemanticColorVariables()` — scope limited to color, or all properties?
- [ ] Document how `extractInstanceSetToken()` differs from `extractComponentToken()` — what extra data does instance carry? (`InstanceToken` carries `remote: boolean`, `componentNode: ComponentNode | null`, and `variantProperties`)
