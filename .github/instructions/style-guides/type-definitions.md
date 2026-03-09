# Type Definitions Style Guide

## Unique Conventions in This Codebase

### Union Types with Discriminated Types

**Unique Pattern**: Token types use discriminated unions with 'type' property:

```tsx
type Token = StyleToken | VariableToken | EffectToken | ComponentToken;

interface StyleToken {
  type: 'style';
  property: string;
  value: string | null;
  rawValue: string | null;
}
```

### Message Payload Type Safety

**Unique Pattern**: Plugin messages use branded types with base interfaces:

```tsx
export interface BaseMessageToUIPayload {
  type: string;
}

export interface OutputStylesPayload extends BaseMessageToUIPayload {
  type: 'output-styles';
  styles: string;
  warnings: string[];
  errors: string[];
}
```
