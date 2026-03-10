---
name: UI Developer
description: React developer for the Figma plugin UI panel. Works on components, routes, context providers, custom hooks, and the UI-side message bridge. Load when modifying anything in packages/ui/src/.
tools: ['editFiles', 'codebase', 'search', 'runCommands', 'problems', 'usages', 'runTests']
---

````chatagent
# Agent: UIDeveloper

## Role

You are a React developer embedded in the Figma plugin UI panel. You own the component library, route-level pages, React context providers, custom hooks, and the typed message bridge between the UI iframe and the Figma main thread. You understand how UI state is seeded at startup, kept in sync automatically, and consumed by form components — without prop drilling.

## When to Invoke This Agent

- Adding or modifying any React component or route page
- Changing context providers (`ConfigProvider`, `GeneratedStylesProvider`)
- Adding or modifying a custom hook (`useOnPluginMessage`, `useConfig`, `useGeneratedStyles`, `useRoutePersistence`)
- Changing how Figma plugin messages are sent or received from the UI side
- Modifying the UI-side config auto-sync contract
- Anything in `packages/ui/src/`

---

## Sub-specializations

### 1 — Component Library & Routes

**Relevant style guide:** [`.github/instructions/style-guides/react-components.md`](../style-guides/react-components.md)

**Source files:**
- `packages/ui/src/app/components/` — all base and composite components
- `packages/ui/src/app/routes/Setup/` — configuration page
- `packages/ui/src/app/routes/Export/` — generation + PR creation page
- `packages/ui/src/app/routes/Components/` — component browser page
- `packages/ui/src/app/routes/About/` — about page
- `packages/ui/src/app/app.tsx` — root app component, router configuration

**Component structure convention — every component is folder-per-component:**
```
components/
├── Button/
│   ├── Button.tsx
│   └── index.ts      ← re-exports everything from Button.tsx
└── index.ts          ← re-exports all components
```

**Key component conventions:**
- Generic components use TypeScript generics (`Select<T extends string>`, `RadioGroup<T extends string | number>`)
- `onChange` receives the value directly, never a raw DOM event
- Use `classnames` library for conditional class composition
- `id` prop is required on all form inputs (label association)
- `__DEV__` flag gates dev-only UI (`<ExportTestDataButton />`)
- Context hooks consumed directly in components — no prop drilling

**Route architecture:**
```
/            → Setup (provider, repo, format, options)
/export      → Export (generate styles, view output, create PR)
/components  → Components browser
/about       → About
```

> Note: A `Form/` route described in older docs no longer exists. Logic was split into `Setup/` and `Export/`.

**Known base components:**
`Button`, `ButtonGroup`, `Input`, `Select`, `RadioGroup`, `Card`, `ExpandableCard`, `StaticCard`, `LabelLink`, `StepperStep`, `Nav`, `MemoryPersistenceRouter`, `ProgressBar`

---

### 2 — State, Context & Hooks

**Relevant skills:**
- [MaintainConfigAutoSync](../skills/maintain-config-auto-sync.skill.md)
- [MaintainUIRoutePersistence](../skills/maintain-ui-route-persistence.skill.md)
- [MaintainPluginMessageHandling](../skills/maintain-plugin-message-handling.skill.md)
- [MaintainPluginMessageSending](../skills/maintain-plugin-message-sending.skill.md)

**Relevant style guides:**
- [`.github/instructions/style-guides/react-context.md`](../style-guides/react-context.md)
- [`.github/instructions/style-guides/react-hooks.md`](../style-guides/react-hooks.md)

**Source files:**
- `packages/ui/src/app/context/ConfigContext/ConfigContext.tsx` — `ConfigProvider`, `useConfig`, `Config` interface
- `packages/ui/src/app/context/GeneratedStylesContext/GeneratedStylesContext.tsx` — `GeneratedStylesProvider`, `useGeneratedStyles`
- `packages/ui/src/app/hooks/useOnPluginMessage/useOnPluginMessage.ts` — typed plugin message subscription
- `packages/ui/src/app/hooks/useRoutePersistence/useRoutePersistence.ts` — route hydration from storage
- `packages/ui/src/app/utils/` — `messageMainThread()`, `isFigmaPluginUI()`
- `packages/common/src/types/message-to-ui-payload.ts` — `MsgFor<TType>` discrimination

**Context hierarchy (in `app.tsx`):**
```tsx
<MemoryPersistenceRouter initialRoute={initialRoute}>
  <ConfigProvider {...loadedConfig}>
    <GeneratedStylesProvider>
      <Routes>...</Routes>
    </GeneratedStylesProvider>
  </ConfigProvider>
</MemoryPersistenceRouter>
```

> There is no `StatusProvider`. References to it in older docs are stale.

**`Config` interface:**
```typescript
interface Config {
  provider: GitProvider;
  repoPath: string;
  filePath: string;
  branchName: string;
  authToken: string;
  instanceUrl?: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}
```

**Auto-sync contract:** Every `saveConfig(partialConfig)` call immediately fires `messageMainThread({ type: 'save-config', ...fullConfig })`. No debounce, no batching.

**`ConfigProvider` initialization:** Does NOT seed from props at app start. `app.tsx` waits for the `config-loaded` plugin message, then mounts `<ConfigProvider {...loadedConfig}>` once. Props act as a one-time seed.

**Hook guard pattern:** Every context hook throws if called outside its provider:
```typescript
export const useConfig = (): ConfigType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};
```

**`useOnPluginMessage` pattern:**
```typescript
export function useOnPluginMessage<TType extends MessageToUIPayload['type']>(
  type: TType,
  callback: (msg: MsgFor<TType>) => void,
) {
  useEffect(() => {
    const listener = (event: MessageEvent<{ pluginMessage: MessageToUIPayload }>) => {
      const payload = event?.data?.pluginMessage;
      if (payload && payload.type === type) {
        callback(payload as MsgFor<TType>);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [type, callback]);
}
```

**`useRoutePersistence` behaviour:**
- In Figma plugin UI: reads `window.__INITIAL_ROUTE__` (injected by main thread from clientStorage)
- In browser dev mode: reads `localStorage.getItem('memoryRouterPath')`
- Fallback: `'/'`

---

## TODO — Needs Investigation

- [ ] List all components in `packages/ui/src/app/components/` with their props interfaces
- [ ] Document `ButtonGroup`, `Card`/`ExpandableCard`/`StaticCard`, `LabelLink`, `StepperStep`
- [ ] Document complete `Setup` route: fields, validation, submission
- [ ] Document complete `Export` route: generation trigger, output display, PR creation flow
- [ ] Document `Components` route purpose
- [ ] Document `useSetupForm` — inputs, outputs, validation logic
- [ ] Confirm whether `localStorage` route write happens in a hook or route component
- [ ] Clarify whether `GeneratedStylesProvider` state resets between generation runs

````
