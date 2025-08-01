# Utility Functions Style Guide

## Overview
Utility functions provide reusable, domain-agnostic functionality used throughout the codebase. They handle common operations like data manipulation, type conversion, validation, and formatting.

## File Structure
- `utils/index.ts` - Central exports for all utilities
- `utils/array.utils.ts` - Array manipulation utilities
- `utils/color.utils.ts` - Color conversion and formatting
- `utils/error.utils.ts` - Error handling and message management
- `utils/gradient.utils.ts` - Gradient processing utilities
- `utils/node.utils.ts` - Figma node manipulation utilities
- `utils/string.utils.ts` - String manipulation and formatting
- `utils/test.utils.ts` - Testing helper utilities
- `utils/units.utils.ts` - Unit conversion utilities
- `utils/value.utils.ts` - Value normalization utilities

## Core Patterns

### Pure Function Pattern
```typescript
// All utility functions should be pure (no side effects)
export function utilityFunction(input: InputType): OutputType {
  // Process input without modifying it
  return processedOutput;
}
```

### Type-Safe Conversion Pattern
```typescript
export function convertValue<T>(value: unknown): T | null {
  try {
    // Safe type conversion with validation
    return value as T;
  } catch (error) {
    return null;
  }
}
```

### Options Pattern
```typescript
interface UtilityOptions {
  precision?: number;
  fallback?: string;
  strict?: boolean;
}

export function utilityWithOptions(
  input: InputType, 
  options: UtilityOptions = {}
): OutputType {
  const { precision = 2, fallback = 'default', strict = false } = options;
  // Implementation with options
}
```

## Domain-Specific Guidelines

### Array Utilities
```typescript
// Grouping pattern
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const k = key(item);
      if (!groups[k]) groups[k] = [];
      groups[k].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}
```

### Color Utilities
```typescript
// Color conversion pattern
export function rgbaToString(r: number, g: number, b: number, a: number): string {
  // Handle alpha channel appropriately
  return a === 1
    ? `#${toHex(r)}${toHex(g)}${toHex(b)}`
    : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

// Hex conversion helper
function toHex(value: number): string {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, '0');
}
```

### Value Normalization
```typescript
// Property-aware normalization
export function normalizeValue({ propertyName, value }: NormalizeOptions): string {
  const type = getValueType(propertyName);
  
  switch (type) {
    case 'opacity':
      return normalizeOpacity(value);
    case 'lineHeight':
      return normalizeLineHeight(value);
    case 'dimension':
      return normalizeDimension(value);
    default:
      return value.toString();
  }
}
```

### Unit Conversion
```typescript
// Flexible unit conversion
const convert = (
  value: number | string,
  to: string = 'rem',
  options: ConvertOptions = {}
): string => {
  const { baseline = 16, precision = 3, unit = true } = { ...defaults, ...options };
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const converted = numericValue / baseline;
  const rounded = Math.floor(converted * Math.pow(10, precision)) / Math.pow(10, precision);
  
  return unit ? `${rounded}${to}` : rounded.toString();
};
```

## Error Handling Utilities

### Error Deduplication
```typescript
export function deduplicateMessages(tokens: Array<{ warnings?: string[]; errors?: string[] }>) {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();
  
  tokens.forEach(token => {
    token.warnings?.forEach(warning => warningsSet.add(warning));
    token.errors?.forEach(error => errorsSet.add(error));
  });
  
  return {
    warnings: Array.from(warningsSet),
    errors: Array.from(errorsSet)
  };
}
```

### Safe Error Handling
```typescript
export function safeOperation<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch (error) {
    console.warn('Operation failed:', error);
    return fallback;
  }
}
```

## String Utilities

### Case Conversion
```typescript
export function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
```

### Sanitization
```typescript
export function sanitizeClassName(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}
```

## Node Utilities

### Type Guards
```typescript
export function isTextNode(node: SceneNode): node is TextNode {
  return node.type === 'TEXT';
}

export function hasProperty<T extends string>(
  node: any, 
  property: T
): node is Record<T, any> {
  return node && typeof node === 'object' && property in node;
}
```

### Property Access
```typescript
export function getNodeProperty<T>(
  node: SceneNode, 
  property: string, 
  fallback: T
): T {
  return hasProperty(node, property) ? node[property] : fallback;
}
```

## Testing Utilities

### Mock Helpers
```typescript
export function createMockNode(overrides: Partial<SceneNode> = {}): SceneNode {
  return {
    id: 'mock-id',
    type: 'FRAME',
    name: 'Mock Node',
    ...overrides
  } as SceneNode;
}
```

### Assertion Helpers
```typescript
export function expectNoErrors(result: { errors?: string[] }): void {
  expect(result.errors || []).toHaveLength(0);
}

export function expectValidValue(value: unknown): void {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  expect(value).not.toBe('');
}
```

## Best Practices

### 1. Immutability
Never mutate input parameters:
```typescript
// Good
export function addItem<T>(array: T[], item: T): T[] {
  return [...array, item];
}

// Bad
export function addItem<T>(array: T[], item: T): T[] {
  array.push(item);
  return array;
}
```

### 2. Type Safety
Use TypeScript features for safety:
```typescript
export function processValue<T extends string | number>(
  value: T
): T extends string ? string : number {
  // Type-safe processing
}
```

### 3. Default Parameters
Provide sensible defaults:
```typescript
export function formatValue(
  value: number,
  precision: number = 2,
  unit: string = 'px'
): string {
  return `${value.toFixed(precision)}${unit}`;
}
```

### 4. Error Boundaries
Handle edge cases gracefully:
```typescript
export function safeParseFloat(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
```

### 5. Documentation
Document complex utilities:
```typescript
/**
 * Converts a CSS property value to the appropriate unit
 * @param value - The numeric value to convert
 * @param property - The CSS property name for context
 * @param options - Conversion options
 * @returns Formatted value with appropriate unit
 */
export function convertToUnit(
  value: number,
  property: string,
  options?: ConvertOptions
): string {
  // Implementation
}
```

## Testing Requirements
- Test edge cases (null, undefined, empty values)
- Test type conversions and validations
- Test error handling and fallbacks
- Test mathematical operations for precision
- Test string manipulations for special characters
- Mock external dependencies appropriately
