# Agent: UIComponentAgent

## Purpose

Owns the UI component library and route-level pages. Responsible for base components, route pages (`Setup`, `Export`, `Components`, `About`), and adherence to the component structure conventions (folder-per-component, barrel exports, generic component patterns).

## Source Files

- `packages/ui/src/app/components/` — all base and composite components
- `packages/ui/src/app/routes/Setup/` — setup/configuration page
- `packages/ui/src/app/routes/Export/` — export/generation page
- `packages/ui/src/app/routes/Components/` — component browser page
- `packages/ui/src/app/routes/About/` — about page
- `packages/ui/src/app/app.tsx` — root app component, router configuration

## Skills Used

None — this agent creates and maintains components directly. It consumes state via **UIStateAgent**'s hooks.

## Domain Knowledge

### Component Structure Convention

Every component lives in its own folder with a barrel export:

```
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

Each component folder re-exports its module, and the top-level `components/index.ts` re-exports everything:

```typescript
// components/Button/index.ts
export * from './Button';

// components/index.ts
export * from './Button';
export * from './Input';
export * from './Select';
```

### Component Implementation Patterns

#### Generic Component Pattern

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

#### Form Input Composition

Route-specific form components compose base components and consume context hooks:

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

#### Context Integration

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

### Route Architecture

```
/          → Setup route (configuration: provider, repo, format, options)
/export    → Export route (generate styles, view output, create PR)
/components → Components browser route
/about     → About page
```

Note: older instructions describe a `Form/` route — this no longer exists. The form logic has been split across `Setup/` and `Export/`.

### Known Components (Partial — Needs Full Audit)

Base components:

- `Button`, `ButtonGroup`
- `Input`, `Select`
- `RadioGroup` — generic over `T extends string | number`
- `Card`, `ExpandableCard`, `StaticCard`
- `LabelLink`
- `StepperStep`

Layout / infrastructure components:

- `Nav` — tab navigation bar between routes
- `MemoryPersistenceRouter` — route persistence via Figma client storage; see `maintain-ui-route-persistence.skill.md`
- `ProgressBar` — generic loading bar (distinct from `GeneratingStylesProgressBar` in the Export route)

Route-level components (under routes/):

- `Setup/` — includes `hooks/useSetupForm.ts`; route-specific form components: `RepoPathInput`, `FilePathInput`, `FormatSelect`
- `Export/` — includes `Output`, `Status`, `GeneratingStylesProgressBar`, `ExportTestDataButton`
- `Components/`
- `About/`

### Component Conventions

- Generic components accept `id` prop (required for form inputs and label association)
- `onChange` callbacks receive the value directly — not a raw DOM event:

  ```tsx
  <Input
    id="repoPath"
    onChange={setRepoPath} // receives the string value, not a ChangeEvent
  />
  ```

- Context hooks (`useConfig`, `useGeneratedStyles`) consumed directly in components — no prop drilling
- Use the `classnames` library for conditional class composition:

  ```tsx
  import classnames from 'classnames';

  const cls = classnames('base-class', {
    active: isActive,
    disabled: isDisabled,
  });
  ```

- `__DEV__` feature flag gates dev-only UI:

  ```tsx
  {
    __DEV__ && <ExportTestDataButton />;
  }
  ```

- Progressive enhancement: components render usefully with minimum required props

### `useSetupForm` Hook

Located at `packages/ui/src/app/routes/Setup/hooks/useSetupForm.ts`. Encapsulates form state and submission logic for the Setup route.

## TODO — Needs Full Investigation (Primary Coverage Gap)

- [ ] List all components in `packages/ui/src/app/components/` with their props interfaces
- [ ] Document `ButtonGroup` — does it manage selection state or is it purely layout?
- [ ] Document `Card`/`ExpandableCard`/`StaticCard` — what distinguishes them?
- [ ] Document `LabelLink` — is this a link with a label, or a label that acts as a link?
- [ ] Document `StepperStep` — is there a `Stepper` parent? What drives step state?
- [ ] Document complete `Setup` route: all fields, validation, submission behavior
- [ ] Document complete `Export` route: generation trigger, output display, PR creation flow
- [ ] Document `Components` route: what does it browse? Figma components? Generated classes?
- [ ] Document `useSetupForm` — inputs, outputs, validation logic
- [ ] Document router setup in `app.tsx` — library used (React Router?), route definitions
- [ ] Document `Nav` — what tabs does it render? How does it determine the active route?
- [ ] Document `MemoryPersistenceRouter` — how does it read `window.__INITIAL_ROUTE__`? What message protocol does it use?
- [ ] Document `RadioGroup` — confirmed generic over `T extends string | number`; document how it differs from `Select` in UX/behavior
- [ ] Document `ProgressBar` — is it truly generic (accepts `value`/`max`)? How does `GeneratingStylesProgressBar` compose it?
