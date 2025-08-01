# Type Definitions Style Guide

## Overview
Type definitions provide TypeScript interfaces and types that ensure type safety across the entire codebase. They define the shape of data structures, API contracts, and component interfaces.

## File Structure
- `types/index.ts` - Central exports for all types
- `types/tokens.ts` - Token-related type definitions
- `types/processor.types.ts` - Processor result types
- `types/processors.ts` - Processor interface definitions
- `types/gradients.ts` - Gradient-specific types
- `types/json.d.ts` - JSON module declarations
- `types/test.d.ts` - Testing type definitions

## Core Patterns

### Base Interface Pattern
```typescript
export interface BaseToken {
  type: 'variable' | 'style';
  name: string;
  property: string;
  path: {
    type: SceneNode['type'];
    name: string;
  }[];
  valueType?: string | null;
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
  };
}
```

### Interface Extension Pattern
```typescript
export interface VariableToken extends BaseToken {
  type: 'variable';
  value: string; // SASS variable reference
  rawValue: string; // Actual value
}

export interface StyleToken extends BaseToken {
  type: 'style';
  value: string | null;
  rawValue: string | null;
  variables?: VariableToken[];
  warnings?: string[];
  errors?: string[];
}
```

### Discriminated Union Pattern
```typescript
export type Token = VariableToken | StyleToken;

// Type guards for discriminated unions
export function isVariableToken(token: Token): token is VariableToken {
  return token.type === 'variable';
}

export function isStyleToken(token: Token): token is StyleToken {
  return token.type === 'style';
}
```

### Generic Type Pattern
```typescript
export interface ProcessorResult<T = string> {
  value: T;
  warnings?: string[];
  errors?: string[];
}

export interface Collection<T> {
  items: T[];
  metadata: CollectionMetadata;
}
```

## Token Type System

### Base Token Structure
```typescript
interface BaseToken {
  type: 'variable' | 'style';
  name: string;           // Token identifier
  property: string;       // CSS property name
  path: NodePath[];       // Figma node path
  valueType?: string;     // Value type (px, rem, etc.)
  metadata?: TokenMetadata;
}
```

### Variable Token
```typescript
export interface VariableToken extends BaseToken {
  type: 'variable';
  value: string;    // Variable reference ($variable-name)
  rawValue: string; // Actual computed value
}
```

### Style Token
```typescript
export interface StyleToken extends BaseToken {
  type: 'style';
  value: string | null;        // CSS with variables
  rawValue: string | null;     // CSS with raw values
  variables?: VariableToken[]; // Associated variables
  warnings?: string[];         // Processing warnings
  errors?: string[];           // Processing errors
  componentId?: string;        // Source component ID
}
```

### Token Collections
```typescript
export interface TokenCollection {
  tokens: Token[];
  warnings?: string[];
  errors?: string[];
  metadata?: {
    generatedAt: string;
    figmaFileId: string;
    version: string;
  };
}
```

## Processor Types

### Processor Interface
```typescript
export interface StyleProcessor {
  property: string;                    // CSS property to process
  bindingKey: string;                  // Figma property key
  process: ProcessorFunction;          // Processing function
}

export type ProcessorFunction = (
  variables: VariableToken[],
  node?: SceneNode,
) => Promise<ProcessedValue | null>;
```

### Processed Value
```typescript
export interface ProcessedValue {
  value: string;
  rawValue: string;
  warnings?: string[];
  errors?: string[];
  metadata?: {
    source: 'variable' | 'computed';
    processor: string;
  };
}
```

## Gradient Types

### Gradient Structures
```typescript
export interface GradientStop {
  position: number;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export interface ProcessedGradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;
  center?: { x: number; y: number };
}
```

## Utility Types

### Non-Nullable Types
```typescript
export type NonNullableStyleToken = StyleToken & {
  value: string;
  rawValue: string;
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### Path Types
```typescript
export interface NodePath {
  type: SceneNode['type'];
  name: string;
  id?: string;
}

export type PathString = string; // "ComponentName/VariantName/ElementName"
```

### Metadata Types
```typescript
export interface TokenMetadata {
  figmaId?: string;
  variableId?: string;
  variableName?: string;
  createdAt?: string;
  modifiedAt?: string;
  version?: number;
}
```

## Transformer Types

### Transformer Result
```typescript
export interface TransformerResult {
  output: string;
  warnings: string[];
  errors: string[];
  metadata?: {
    format: string;
    generatedAt: string;
    tokenCount: number;
  };
}
```

### Format-Specific Types
```typescript
export interface CSSTransformerOptions {
  includeComments: boolean;
  useRem: boolean;
  classPrefix?: string;
}

export interface TailwindTransformerOptions {
  generateUtilities: boolean;
  includeThemeConfig: boolean;
  customUtilities?: Record<string, any>;
}
```

## Best Practices

### 1. Optional vs Required
Use optional properties judiciously:
```typescript
interface Token {
  name: string;           // Always required
  value: string;          // Always required
  metadata?: Metadata;    // Optional, may not exist
  warnings?: string[];    // Optional, empty by default
}
```

### 2. Discriminated Unions
Use type discriminators for polymorphic types:
```typescript
type Result = 
  | { success: true; data: any }
  | { success: false; error: string };
```

### 3. Generic Constraints
Use generic constraints for type safety:
```typescript
interface Processor<T extends SceneNode> {
  process(node: T): ProcessedValue;
}
```

### 4. Readonly Types
Use readonly for immutable data:
```typescript
interface ReadonlyToken {
  readonly name: string;
  readonly value: string;
  readonly metadata: Readonly<TokenMetadata>;
}
```

### 5. Type Guards
Implement type guards for runtime safety:
```typescript
export function hasProperty<T extends string>(
  obj: any,
  prop: T
): obj is Record<T, any> {
  return obj != null && typeof obj === 'object' && prop in obj;
}
```

## Module Declarations

### JSON Imports
```typescript
// json.d.ts
declare module "*.json" {
  const value: any;
  export default value;
}
```

### Test Utilities
```typescript
// test.d.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidTokenStructure(): R;
      toMatchFigmaNode(expected: SceneNode): R;
    }
  }
}
```

## Testing Types

### Test Data Types
```typescript
export interface TestFixture {
  name: string;
  input: any;
  expected: any;
  description?: string;
}

export interface MockNode extends Partial<SceneNode> {
  id: string;
  type: SceneNode['type'];
  name: string;
}
```

## Validation

### Type Validation
```typescript
export function validateToken(token: any): token is Token {
  return (
    token &&
    typeof token.name === 'string' &&
    typeof token.type === 'string' &&
    ['variable', 'style'].includes(token.type)
  );
}
```

### Schema Validation
```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
}
```

## Testing Requirements
- Validate all interface definitions compile correctly
- Test type guards with various input types
- Test discriminated union type narrowing
- Validate generic type constraints
- Test module declaration functionality
- Ensure backward compatibility of type changes
