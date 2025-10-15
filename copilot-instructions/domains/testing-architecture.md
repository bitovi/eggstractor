# Testing Architecture Domain

## Overview

The testing architecture domain provides comprehensive testing patterns for processors, transformers, components, and end-to-end workflows. This system ensures reliability through structured test data, snapshot testing, and mock environments.

## Test Framework Configuration

### Vitest for Unit Testing

The project uses Vitest with comprehensive configuration:

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

### Playwright for E2E Testing

End-to-end tests use Playwright with realistic user scenarios:

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

## Processor Testing Patterns

### Mock Figma Environment

Tests use `createTestData` utility with JSON fixtures:

```typescript
describe('Background Processors', () => {
  it('should process background solid correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('solid styles');
  });
});
```

### Test Data Management

Fixtures mirror real Figma API responses:

```text
src/tests/fixtures/
├── figma-test-data_background.json
├── figma-test-data_border-position.json
├── figma-test-data_border-radius.json
├── figma-test-data_demo.json
└── figma-test-data_padding.json
```

## Snapshot Testing Strategy

### Transformer Output Validation

All transformers use snapshot testing for regression prevention:

```typescript
it('should process layout alignment correctly', async () => {
  const tokens = await collectTokens(vi.fn());
  const { result: template } = transformToScss(tokens, false);
  expect(template).toMatchSnapshot('alignment');

  const { result: combinatorial } = transformToScss(tokens, true);
  expect(combinatorial).toMatchSnapshot('alignment');
});
```

### Snapshot Organization

Snapshots are organized by test category:

```text
__snapshots__/
├── demo-data.test.ts.snap
├── processors/
│   ├── background-processors.test.ts.snap
│   ├── border-processors.test.ts.snap
│   └── layout-processors.test.ts.snap
└── transformers/
    ├── css.transformer.test.ts.snap
    └── scss.transformer.test.ts.snap
```

## Mock Development Environment

### Figma Plugin Simulation

Development mode includes comprehensive Figma mocking:

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

### Test Isolation

Each test properly isolates global state:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  global.figma = createMockFigma();
});

afterEach(() => {
  vi.resetAllMocks();
});
```

This testing architecture ensures comprehensive coverage while maintaining fast, reliable test execution across all project components.
