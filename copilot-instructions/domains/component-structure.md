# Component Structure Domain

## Overview

The component structure domain defines consistent patterns for organizing, building, and composing React components. This system ensures maintainable component architecture with clear separation of concerns.

## Folder Structure Pattern

### Component Organization

Each component follows a consistent folder structure:

```text
components/
├── Button/
│   ├── Button.tsx
│   └── index.ts
├── Input/
│   ├── Input.tsx
│   └── index.ts
└── Select/
    ├── Select.tsx
    └── index.ts
```

### Barrel Export Pattern

Every component folder contains an `index.ts` for clean imports:

```typescript
// components/Button/index.ts
export * from './Button';

// components/index.ts
export * from './Button';
export * from './Input';
export * from './Select';
```

## Component Implementation Patterns

### Generic Component Pattern

Components use TypeScript generics for type safety:

```tsx
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  className?: string;
}

export interface SelectProps<T extends string = string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  options: SelectOption<T>[];
  value?: T;
  onChange: (option: SelectOption<T>) => void;
}

export const Select = <T extends string = string>({
  options,
  value,
  onChange,
  ...props
}: SelectProps<T>) => {
  // Implementation
};
```

### Form Input Composition

Form components compose shared base components:

```tsx
export const RepoPathInput: FC = () => {
  const { repoPath, setRepoPath } = useConfig();
  return (
    <Input
      id="repoPath"
      label="Repository (owner/repo):"
      placeholder="e.g., bitovi/design-system"
      value={repoPath}
      onChange={setRepoPath}
    />
  );
};
```

### Context Integration

Components seamlessly integrate with application context:

```tsx
export const FormatSelect: FC = () => {
  const { format, setFormat } = useConfig();
  return (
    <Select<StylesheetFormat>
      id="formatSelect"
      value={format}
      onChange={(option) => setFormat(option.value)}
      options={FORMAT_OPTIONS}
    />
  );
};
```

## Component Categories

### Base Components

Reusable primitives that don't depend on application context:

- `Button`: Standard button with styling
- `Input`: Form input with label
- `Select`: Dropdown selection
- `RadioGroup`: Radio button groups

### Form Components

Application-specific inputs that connect to context:

- `RepoPathInput`: GitHub repository input
- `FilePathInput`: File path configuration
- `FormatSelect`: Output format selection

### Layout Components

Structure and navigation components:

- `MemoryPersistenceRouter`: Route persistence
- `ProgressBar`: Loading indication

This component architecture ensures consistency, reusability, and maintainability across the entire UI.
