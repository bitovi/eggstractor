# Skill: MaintainVariableService

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the variable service without breaking primitive and semantic variable token collection.

## Implementation

- File: `packages/figma/src/services/variable.service.ts`
- Key exports:
  - `collectPrimitiveVariables(collection, onProgress)` — raw variable values
  - `collectSemanticColorVariables(collection, onProgress)` — alias chains resolved to CSS var references
  - `createPrimitiveVariableToken(variable, collection)` — single variable → `VariableToken`

## Input

```typescript
collection: TokenCollection          // mutated in place — tokens appended
onProgress: (percent: number, message: string) => void
```

## Output

Mutates `collection.tokens` by appending `VariableToken` objects. Returns `Promise<void>`.

## Token Types Produced

- `StandardVariableToken` — single-mode variable with a resolved CSS value
- `ModeVariableToken` — multi-mode variable with `modeId`, `modeName`, `modeValues`, `modes[]`

## Key Behaviors

- Primitive variables: each `VariableCollection` → each `Variable` → `createPrimitiveVariableToken()`
- Semantic color variables: variables whose value is an alias to another variable; resolved via `resolveToPrimitiveVariableName()`
- Multi-mode collections → one `ModeVariableToken` per variable with all mode values encoded
- `inferPropertyFromVariableName()` used to assign `property` when Figma does not expose it explicitly

## TODO

- [ ] Document which Figma `resolvedType` values are supported (COLOR, FLOAT, STRING, BOOLEAN?)
- [ ] Document `inferPropertyFromVariableName()` heuristics — what naming patterns map to which CSS properties?
- [ ] Document `getVariableActualValue()` — does it use a specific mode or the default mode?
- [ ] Document how alias chains longer than 2 levels are resolved
- [ ] Document `resolveToPrimitiveVariableName()` — does it return a CSS variable reference or a raw value?
- [ ] Document `collectSemanticColorVariables()` scope — only colors, or all aliased variable types?
