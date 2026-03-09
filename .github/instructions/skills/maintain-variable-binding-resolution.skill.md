# Skill: MaintainVariableBindingResolution

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend variable binding resolution without breaking the alias-to-token lookup pipeline.

## Implementation

- File: `packages/figma/src/services/variable.service.ts`
- Key export: `collectBoundVariable(varId, property, path, node) → Promise<VariableToken | null>`
- Support: `packages/figma/src/utils/is-variable-alias.utils.ts` — `isVariableAlias(value)`
- Support: `packages/figma/src/utils/mode.utils.ts` — `getModesFromCollection()`, `getDefaultMode()`

## Input

```typescript
varId: string; // Figma variable ID from VariableAlias
property: string; // CSS property name (e.g., 'background', 'font-size')
path: BaseToken['path']; // PathNode[] from the node being processed
node: SceneNode; // Source node (for context)
```

## Output

```typescript
Promise<VariableToken | null>;
// null if variable not found or type not supported
```

## Key Behaviors

- Calls `figma.variables.getVariableByIdAsync(varId)` to retrieve the `Variable`
- If variable belongs to a multi-mode collection → produces `ModeVariableToken`
- If variable belongs to a single-mode collection → produces `StandardVariableToken`
- `primitiveRef` set when variable is an alias to another primitive variable
- `isVariableAlias(value)` distinguishes alias values `{ type: 'VARIABLE_ALIAS', id }` from primitives

## Variable Binding Flow (In Processors)

```
1. Check node's boundVariables[bindingKey]
2. If VariableAlias found → call collectBoundVariable()
3. If VariableToken returned → use as token value
4. If null → fall back to literal node value
```

## Key Utilities

```typescript
// is-variable-alias.utils.ts
isVariableAlias(value): value is { type: 'VARIABLE_ALIAS'; id: string }

// mode.utils.ts
getModesFromCollection(collection: VariableCollection): ModeInfo[]
getDefaultMode(collection: VariableCollection): ModeInfo
hasMultipleModes(collection: VariableCollection): boolean
```

## TODO

- [ ] Document how mode resolution is selected when multiple modes exist (default mode vs. all modes)
- [ ] Document `modePrimitiveRefs` — when is this populated vs. `primitiveRef`?
- [ ] Document what `getVariableActualValue()` does for each Figma `resolvedType`
- [ ] Document behavior when `getVariableByIdAsync()` returns `null` (missing variable)
- [ ] Document alias chain resolution depth limit (is there one?)
