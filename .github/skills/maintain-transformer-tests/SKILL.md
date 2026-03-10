---
name: maintain-transformer-tests
description: Provides an agent with the knowledge needed to safely add, modify, or debug transformer tests without breaking snapshot regression coverage or inline mock collection conventions.
---

````markdown
# Skill: MaintainTransformerTests

## Purpose

Provides an agent with the knowledge needed to safely add, modify, or debug transformer tests without breaking snapshot regression coverage or inline mock collection conventions.

## Implementation

- Test files: `packages/figma/src/tests/transformers/`
- Framework: Vitest
- No fixture files or `global.figma` mock needed — transformers are pure functions

## Inputs

- Inline `TokenCollection` constructed via a `createMockCollection()` helper
- Transformer function (e.g., `transformToScss`, `transformToCss`, `transformToTailwindSassClass`, `transformToTailwindLayerUtilityClassV4`)
- Expected output: `TransformerResult` string or structural assertions

## Test Pattern

```typescript
// packages/figma/src/tests/transformers/scss.transformer.test.ts
const createMockCollection = (): TokenCollection => ({
  tokens: [
    /* VariableToken and StyleToken objects */
  ],
  components: {},
  componentSets: {},
  instances: {},
});

it('should output only SCSS variables when outputMode is "variables"', () => {
  const collection = createMockCollection();
  const result = transformToScss(collection, false, false, 'variables');
  expect(result.result).toContain('$color-primary');
  expect(result.result).not.toContain('@mixin');
});
```

## Key Differences From Processor Tests

| Dimension           | Transformer Tests                                 | Processor Tests                           |
| ------------------- | ------------------------------------------------- | ----------------------------------------- |
| Fixture source      | Inline `createMockCollection()`                   | JSON fixture file via `createTestData()`  |
| `global.figma` mock | Not needed                                        | Required before calling `collectTokens()` |
| Async               | No — transformer calls are synchronous            | Yes — `async/await` throughout            |
| Primary assertions  | `toContain` / `not.toContain` + `toMatchSnapshot` | `toMatchSnapshot('label')`                |
| Test directory      | `tests/transformers/`                             | `tests/processors/`                       |

## Snapshot Strategy

- Snapshot files stored in `tests/transformers/__snapshots__/` adjacent to test files:
  ```
  tests/transformers/
    __snapshots__/
      css.transformer.test.ts.snap
      scss.transformer.test.ts.snap
  ```
- Transformer tests use `toMatchSnapshot` for regression prevention and `toContain` / `not.toContain` for structural correctness
- Update snapshots with:
  ```bash
  npx nx run @eggstractor/figma:test -- --update-snapshots
  ```
- Always review the diff before committing updated snapshots

## Adding a New Transformer Test

1. Import the transformer under test and construct a `createMockCollection()` function inline in the test file
2. Call the transformer synchronously and assert on `result.result` (the CSS/SCSS string)
3. Use `toContain` to verify specific output tokens are present or absent
4. Use `toMatchSnapshot` to lock in the full output as a regression baseline
5. Run once to generate the initial snapshot, review for correctness, then commit

## TODO

- [ ] Document which transformer/outputMode combinations currently have test coverage
- [ ] Document how `generateSemanticColorUtilities` flag is tested
- [ ] Document whether `useCombinatorialParsing: true` paths have separate test cases
````
