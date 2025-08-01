# Testing Strategy Domain

The testing strategy domain defines how the codebase maintains quality through comprehensive testing patterns. It uses Jest with TypeScript support and emphasizes snapshot testing for output consistency.

## Test Organization

Tests are organized by component category:

- `src/tests/processors/`: Processor-specific tests
- `src/tests/services/`: Service layer tests  
- `src/tests/variants/`: Component variant tests
- `src/transformers/tailwind/`: Transformer tests (co-located)

## Snapshot Testing Pattern

The primary testing strategy uses Jest snapshots for output consistency:

```typescript
// From demo-data.test.ts
describe('Demo data processor', () => {
  it('should process demo data correctly', async () => {
    const result = await processData(demoInput);
    expect(result).toMatchSnapshot();
  });
});
```

## Fixture Data Strategy

Tests use real Figma data fixtures for realistic testing:

```typescript
// Test fixtures include:
// - figma-test-data_background.json
// - figma-test-data_border-color.json  
// - figma-test-data_demo.json
// - etc.
```

## Test Utilities

Dedicated test utilities provide data serialization and mocking:

```typescript
// From test.utils.ts
export function serializeFigmaData(data: any): string {
  // Serialization logic for test data
}
```

## Processor Isolation Testing

Each processor is tested independently to ensure single responsibility:

```typescript
// Example from background-processors.test.ts
describe('Background processors', () => {
  it('should process solid fills correctly', () => {
    // Test individual processor logic
  });
});
```

## No Real API Calls

Tests are designed to avoid real Figma or GitHub API calls:

- Mock Figma node data using fixtures
- No network requests in test environment
- Use serialized data for consistent test results

## Snapshot Management

Snapshots are maintained for:

- Generated SCSS output
- Generated CSS output  
- Tailwind utility classes
- Component variant processing results

Test snapshots are located in `src/tests/__snapshots__/` and can be updated using:

```bash
npm run test:snapshot
```

## Test Configuration

Jest configuration supports TypeScript and includes:

```javascript
// jest.config.js configuration
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Additional Jest configuration
};
```

## Continuous Integration

Tests run automatically via GitHub Actions as defined in `.github/workflows/test.yml`.
