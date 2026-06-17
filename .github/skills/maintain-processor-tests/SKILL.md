---
name: maintain-processor-tests
description: Provides an agent with the knowledge needed to safely add, modify, or debug processor tests without breaking fixture conventions, snapshot strategy, or mock Figma environment setup.
---

# Skill: MaintainProcessorTests

## Purpose

Provides an agent with the knowledge needed to safely add, modify, or debug processor tests without breaking fixture conventions, snapshot strategy, or mock Figma environment setup.

> For transformer tests (CSS, SCSS, Tailwind), see [MaintainTransformerTests](./maintain-transformer-tests.skill.md).

## Implementation

- Test files: `packages/figma/src/tests/`
- Utility: `packages/figma/src/tests/utils/createTestData` (or similar — exact name TBD)
- Global mock: `packages/figma/types/test.d.ts` — `global.figma` setup
- Framework: Vitest

## Inputs

- JSON fixture file from `packages/figma/src/tests/fixtures/` (serialized Figma node data)
- Processor array (e.g., `backgroundProcessors`, `fontProcessors`)
- Expected `ProcessedValue` or transformer `TransformerResult`

## Test Pattern

```typescript
// 1. Load fixture
const node = createTestData('fixtures/my-component.json');

// 2. Set up global.figma mock
global.figma = {
  currentPage: ...,
  variables: { getVariableByIdAsync: vi.fn().mockResolvedValue(null) }
};

// 3. Run processor
const result = await processor.process(new Map(), node);

// 4. Assert
expect(result).toMatchSnapshot();
// or
expect(result?.value).toBe('expected-css-value');
```

## Snapshot Strategy

- Snapshot files stored in `__snapshots__/` adjacent to test files
- Processor tests: snapshot the full `ProcessedValue`
- Transformer tests: snapshot the full `TransformerResult.result` string
- Update snapshots with `vitest --update-snapshots` (or equivalent in this workspace)

## Adding a New Test

1. Export test data from Figma using `ExportTestDataButton` (dev mode only)
2. Save the JSON to `packages/figma/src/tests/fixtures/`
3. Write a test using `createTestData()` and the target processor
4. Run test once to generate initial snapshot
5. Review snapshot for correctness before committing

## TODO

- [ ] Confirm `createTestData()` function name and signature
- [ ] Document fixture JSON schema — what fields does it require?
- [ ] Document which processors/transformers currently have test coverage
- [ ] Document `global.figma` mock setup conventions (per-test vs. per-suite `beforeEach`)
- [ ] Document how variable binding is mocked in tests
