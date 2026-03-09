# Agent: TestingAgent

## Purpose

Owns test infrastructure across all packages: Vitest unit tests (figma + common + ui packages), Playwright E2E tests (ui-e2e), fixture management, mock Figma environment setup, and snapshot maintenance strategy.

## Source Files

- `vitest.workspace.ts` — workspace-level Vitest config
- `packages/figma/vite.config.ts` — figma package test config
- `packages/figma/src/tests/` — processor + service + transformer test files
- `packages/ui/src/tests/` — UI component and hook tests
- `packages/common/src/tests/` — shared utility tests
- `packages/ui-e2e/src/` — Playwright E2E tests
- `packages/figma/types/test.d.ts` — global `figma` mock type declaration

## Skills Used

- [MaintainProcessorTests](../skills/maintain-processor-tests.skill.md)
- [MaintainTestDataExport](../skills/maintain-test-data-export.skill.md)
- [MaintainTransformerTests](../skills/maintain-transformer-tests.skill.md)

## Domain Knowledge

### Vitest Workspace

Vitest is configured at the workspace root and discovers per-package configs. Each package has its own `tsconfig.test.json`.

```typescript
// vitest.workspace.ts
export default defineWorkspace([
  './packages/*/vite.config.ts',
  {
    test: {
      name: 'e2e',
      root: './packages/ui-e2e',
    },
  },
]);
```

### Mock Figma Environment

Tests that exercise processors or services require a mock `global.figma` object constructed via `createTestData().setupTest()`. The full shape returned by `setupTest()` is:

```typescript
global.figma = {
  currentPage: pageNode, // reconstructed PageNode from fixture JSON
  root: { children: [pageNode] }, // simulates figma.root.children (array of pages)
  getLocalEffectStylesAsync: () => Promise.resolve([]),
  loadAllPagesAsync: () => Promise.resolve(undefined),
  variables: {
    getVariableByIdAsync, // resolves variables from fixture
    getLocalVariableCollectionsAsync: () => Promise.resolve([mockVariableCollection]),
  },
};
```

This is assigned to `global.figma` **before** calling `collectTokens()` in each test. The type declaration in `types/test.d.ts` declares the global shape; `test.utils.ts` implements it.

### Test Isolation

Each test suite properly isolates global state to prevent cross-test pollution:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  global.figma = createMockFigma(); // if not using createTestData per-it
});

afterEach(() => {
  vi.resetAllMocks();
});
```

### Fixture Pattern (`createTestData`)

Processor and transformer tests use JSON fixture files to represent serialized Figma node data. The `createTestData` utility loads a fixture and reconstructs a mock `SceneNode` that processors can operate on.

```
packages/figma/src/tests/
  fixtures/           ← JSON files (exported from Figma via ExportTestDataButton)
  utils/              ← createTestData() and other test helpers
```

Fixtures are created using the **ExportTestDataButton** available inside the Figma plugin during development — clicking it serializes the current page's nodes and variables to a JSON file that is saved to `tests/fixtures/`.

### Processor Test Pattern

Processor tests use JSON fixtures + `createTestData` to reconstruct real Figma node graphs, then run the full `collectTokens → transform*` pipeline:

```typescript
import { createTestData } from '../test.utils';
import testData from '../fixtures/figma-test-data_background.json';

it('should process background solid correctly', async () => {
  const { setupTest } = createTestData(testData);
  const testSetup = await setupTest();
  global.figma = testSetup.figma;

  const tokens = await collectTokens(vi.fn());
  const { result } = transformToCss(tokens, false);
  expect(result).toMatchSnapshot('solid styles');
});
```

### Transformer Test Pattern

All transformers use snapshot testing as a regression guard, complemented by explicit `toContain` / `not.toContain` assertions for structural correctness.

Transformer tests do **not** use fixtures or `createTestData`. They construct a `TokenCollection` inline via a `createMockCollection()` helper, then call the transformer directly and assert on the string output:

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

Key differences from processor tests:

- No `global.figma` assignment needed
- No `async`/`await` — transformer calls are synchronous
- Assertions use `toContain` for structural checks; `toMatchSnapshot` for regression
- Test files: `tests/transformers/css.transformer.test.ts`, `tests/transformers/scss.transformer.test.ts`

### Snapshot Strategy

- Processor outputs are snapshot-tested with `toMatchSnapshot('label')`
- Transformer outputs are snapshot-tested for regression prevention
- Snapshots are stored in `__snapshots__/` directories adjacent to their test files:

```text
tests/
  __snapshots__/
    demo-data.test.ts.snap
  processors/
    __snapshots__/
      background-processors.test.ts.snap
      border-processors.test.ts.snap
      layout-processors.test.ts.snap
  transformers/
    __snapshots__/
      css.transformer.test.ts.snap
      scss.transformer.test.ts.snap
```

**Updating snapshots:** Run Vitest with the update flag:

```bash
npx nx run @eggstractor/figma:test -- --update-snapshots
```

Always review the diff before committing updated snapshots.

### UI Component / Utility Tests

UI-layer unit tests live in `packages/ui/src/tests/`. The current pattern is pure utility tests using `vi.mock` for external dependencies:

```typescript
// packages/ui/src/tests/utilities/highlightCode.test.ts
vi.mock('highlight.js', () => ({
  default: { highlight: vi.fn<HLHighlight>() },
}));

const mockedHljs = vi.mocked(hljs);

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('calls hljs.highlight with provided language', () => {
  mockedHljs.highlight.mockReturnValue({ value: '<span>ok</span>' } as HighlightResult);
  const result = highlightCode('body { color: red; }', 'scss');
  expect(mockedHljs.highlight).toHaveBeenCalledWith(code, { language: 'scss' });
  expect(result).toBe('<span>ok</span>');
});
```

Note: No React component render tests (`@testing-library/react`) currently exist. If adding component tests, follow the `vi.mock` isolation pattern above.

### E2E Test Scope

Playwright tests in `packages/ui-e2e/` test the full UI in a browser environment (not inside Figma). The UI must be running locally for E2E tests to execute.

Current covered scenario (`packages/ui-e2e/src/example.spec.ts`):

```typescript
test('Generate Styles button flow', async ({ page }) => {
  await page.goto('/');
  const generateBtn = page.locator('#generateBtn');
  await expect(generateBtn).toBeVisible();
  await expect(generateBtn).toHaveText(/^\s*Generate Styles\s*$/);
  await generateBtn.click();
  await expect(page.getByText(/Generated SCSS Variables/)).toBeVisible({ timeout: 15000 });
});
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- E2E tests: `*.spec.ts` in `ui-e2e/src/`

## Fixture JSON Schema

Fixture files (`figma-test-data_*.json`) are exported from Figma via the **ExportTestDataButton** in-plugin action. Each fixture has this top-level shape:

```json
{
  "children": [
    /* array of serialized BaseNode / FrameNode / TextNode objects */
  ],
  "variables": {
    "<variableId>": {
      /* Variable object with resolvedType, valuesByMode, etc. */
    }
  }
}
```

Existing fixtures in `packages/figma/src/tests/fixtures/`:

- `figma-test-data_background.json` — solid/alpha fill backgrounds
- `figma-test-data_border-*.json` — border color, position, radius, shape, sides
- `figma-test-data_font-style.json`, `figma-test-data_paragraph.json` — typography
- `figma-test-data_layout-*.json`, `figma-test-data_padding.json` — spacing/layout
- `figma-test-data_shadow-effects.json` — drop/inner shadows
- `figma-test-data_opacity.json`, `figma-test-data_height.json`, `figma-test-data_width.json`
- `figma-test-data_demo.json` — general demo data

## Mock Development Environment (UI Dev Mode Only)

> **This is not a test mock.** This is the UI-layer development-mode simulation used when running the UI panel outside of Figma (e.g., `vite dev`). It lives in `packages/ui/src/mockFigma/` and simulates the message-passing API so UI development can proceed without a real Figma plugin host.

```typescript
const mockFigma = () => {
  const mockPostMessageToMainThread = (message: MessageToMainThreadPayload) => {
    if (message.type === 'generate-styles') {
      setTimeout(() => {
        mockPostMessageToUI({
          type: 'output-styles',
          styles: generateMockScss(message.format),
          warnings: [],
          errors: [],
        });
      }, 1000);
    }
  };
};
```

`packages/ui/src/mockFigma/` must **never** be imported in test files — it is exclusively for local UI development.

## TODO — Needs Investigation

- [ ] Document `effect.service.test.ts` patterns — does it need a different mock setup?
- [ ] Document GitLab provider test coverage — does any test exercise GitLab MR creation?
- [ ] Document UI route-level tests — do tests exist for `Setup/`, `Export/`, `Components/`?
- [ ] Document how to add a new processor test: full fixture creation workflow (ExportTestDataButton → JSON → test file)
