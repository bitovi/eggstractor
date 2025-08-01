# Unit Tests Style Guide

## Snapshot Testing Convention

Primary testing strategy uses Jest snapshots for output validation:

```typescript
describe('Demo data processor', () => {
  it('should process demo data correctly', async () => {
    const result = await processData(demoInput);
    expect(result).toMatchSnapshot();
  });
});
```

## Test Organization Pattern

Tests are organized by domain with descriptive file names:

- `demo-data.test.ts`: Integration tests with real data
- `demo-data-variants.test.ts`: Component variant testing
- `value.utils.test.ts`: Utility function testing

## Fixture Data Usage

Tests use real Figma data fixtures for realistic scenarios:

```typescript
// Tests reference fixtures from src/tests/fixtures/
// Example: figma-test-data_background.json
```

## Test Naming Convention

Test descriptions follow should/when pattern:

```typescript
describe('Background processors', () => {
  it('should process solid fills correctly', () => {
    // Test implementation
  });
  
  it('should handle gradient fills with warnings', () => {
    // Test implementation
  });
});
```

## Async Test Pattern

Handle async operations properly in tests:

```typescript
it('should process async data correctly', async () => {
  const result = await asyncFunction(input);
  expect(result).toMatchSnapshot();
});
```

## Snapshot Update Script

Use dedicated npm script for snapshot updates:

```bash
npm run test:snapshot  # Updates snapshots when structure changes
```

## Mock-Free Testing

Tests avoid mocks and use real serialized data to ensure accuracy:

```typescript
// Use actual Figma data structures from fixtures
// Avoid complex mocking that can hide real issues
```
