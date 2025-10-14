# React Components Style Guide

## Unique Conventions in This Codebase

### Generic Component Pattern with Type Constraints

**Unique Pattern**: Components use TypeScript generics with specific constraints for type safety:

```tsx
// String-constrained generic with default
export interface SelectProps<T extends string = string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  options: SelectOption<T>[];
  value?: T;
  onChange: (option: SelectOption<T>) => void;
}

// String or number constraint
export interface RadioGroupProps<T extends string | number = string> {
  value?: T;
  onChange: (value: T) => void;
  options: RadioGroupOption<T>[];
}
```

### Object-Based onChange Callbacks

**Unique Pattern**: onChange handlers pass entire objects, not just values:

```tsx
// Standard pattern elsewhere: onChange: (value: T) => void
// This codebase pattern: onChange: (option: SelectOption<T>) => void

const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
  const selectedOption = options.find((option) => option.value === event.target.value);
  if (selectedOption) {
    onChange(selectedOption); // Passes full option object
  }
};
```

### Context Hook Integration Pattern

**Unique Pattern**: Form components directly integrate with context hooks without prop drilling:

```tsx
export const RepoPathInput: FC = () => {
  const { repoPath, setRepoPath } = useConfig();
  return (
    <Input id="repoPath" label="Repository (owner/repo):" value={repoPath} onChange={setRepoPath} />
  );
};
```

### Strict ID Prop Requirements

**Unique Pattern**: All form components require explicit `id` props for accessibility:

```tsx
<Input
  id="repoPath" // Always required, never auto-generated
  label="Repository:"
  value={repoPath}
  onChange={setRepoPath}
/>
```

### Development-Only Component Features

**Unique Pattern**: Components conditionally render features based on `__DEV__` flag:

```tsx
const FORMAT_OPTIONS: SelectOption<StylesheetFormat>[] = [
  // Only include 'css' option in dev mode for testing purposes
  ...(__DEV__ ? [{ value: 'css' as const, label: 'CSS' }] : []),
  { value: 'scss', label: 'SCSS' },
  { value: 'tailwind-scss', label: '(v3) Tailwind-SCSS' },
];

// In JSX:
{
  __DEV__ ? <ExportTestDataButton /> : null;
}
```

### Message Hook Integration Pattern

**Unique Pattern**: Components use `useOnPluginMessage` for Figma plugin communication:

```tsx
export const Output: FC = () => {
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  useOnPluginMessage('output-styles', (msg) => {
    setHighlightedCode(highlightCode(msg.styles));
    setGeneratedStyles(msg.styles);
  });

  if (!highlightedCode) {
    return null; // Conditional rendering based on message state
  }

  return <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
};
```

### Classnames with Utility Library

**Unique Pattern**: Uses `classnames` library for conditional CSS classes:

```tsx
import cn from 'classnames';

export const Button: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  type = 'button',
  ...props
}) => {
  return (
    <button {...props} className={cn('button', props.className)} type={type}>
      {children}
    </button>
  );
};
```

### Progressive Enhancement Default Props

**Unique Pattern**: Sensible defaults for HTML attributes:

```tsx
// Input defaults to 'text' type
export const Input: FC<InputProps> = ({
  label,
  id,
  onChange,
  type = 'text',  // Default type
  ...props
}) => {

// Button defaults to 'button' type
export const Button: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  type = 'button',  // Prevents form submission by default
  ...props
}) => {
```
