# Types Style Guide

## Interface Export Pattern

All type interfaces must be exported for external consumption:

```typescript
export interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings | undefined;
  process: (variables: VariableToken[], node?: SceneNode) => Promise<ProcessedValue | null>;
}
```

## Union Type Organization

Use discriminated unions with type property for token types:

```typescript
export type Token = StyleToken | VariableToken | ComponentToken | ComponentSetToken | InstanceToken;

export interface StyleToken extends BaseToken {
  type: 'style';
  property: string;
  value: string | null;
  rawValue: string | null;
}

export interface VariableToken extends BaseToken {
  type: 'variable';
  value: string;
  rawValue: string;
  valueType: 'px' | 'string' | 'number';
}
```

## Optional Property Convention

Use optional properties with explicit undefined for clarity:

```typescript
export interface VariableBindings {
  fills?: VariableAlias | VariableAlias[];
  strokes?: VariableAlias | VariableAlias[];
  strokeWeight?: VariableAlias | VariableAlias[];
  // ... other optional bindings
}
```

## Array or Single Value Pattern

Support both single values and arrays for flexibility:

```typescript
fills?: VariableAlias | VariableAlias[];
```

## Base Interface Extension

Use base interfaces for common properties:

```typescript
export interface BaseToken {
  id: string;
  name: string;
  path: PathItem[];
  warnings?: string[];
  errors?: string[];
}
```

## Type Declaration Files

Use .d.ts files for external library augmentation:

```typescript
// json.d.ts - for JSON imports
declare module '*.json' {
  const value: any;
  export default value;
}

// test.d.ts - for test utilities
declare global {
  // Test-specific type definitions
}
```

## Generic Type Constraints

Use generic constraints for type safety:

```typescript
export type NonNullableStyleToken = StyleToken & {
  value: string;
  rawValue: string;
};
```

## Processor Result Pattern

Consistent result interfaces for processing functions:

```typescript
export interface ProcessedValue {
  value: string;
  rawValue: string;
  warnings?: string[];
  errors?: string[];
}

export interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
}
```
