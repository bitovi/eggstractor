# Agent: UIStateAgent

## Purpose

Owns React context providers, custom hooks, plugin message integration in the UI package, and the auto-sync contract between UI state and plugin main thread. Responsible for `ConfigProvider`, `GeneratedStylesProvider`, `useOnPluginMessage`, `useConfig`, `useGeneratedStyles`, and `useRoutePersistence`.

## Source Files

- `packages/ui/src/app/context/ConfigContext/ConfigContext.tsx` — `ConfigProvider`, `useConfig`, `Config` interface
- `packages/ui/src/app/context/GeneratedStylesContext/GeneratedStylesContext.tsx` — `GeneratedStylesProvider`, `useGeneratedStyles`
- `packages/ui/src/app/hooks/useOnPluginMessage/useOnPluginMessage.ts` — typed plugin message subscription
- `packages/ui/src/app/hooks/useRoutePersistence/useRoutePersistence.ts` — route hydration from storage
- `packages/ui/src/app/utils/` — `messageMainThread()`, `isFigmaPluginUI()`
- `packages/common/src/types/message-to-ui-payload.ts` — `MsgFor<TType>` discrimination

## Skills Used

- [MaintainPluginMessageSending](../skills/maintain-plugin-message-sending.skill.md)
- [MaintainPluginMessageHandling](../skills/maintain-plugin-message-handling.skill.md)
- [MaintainUIRoutePersistence](../skills/maintain-ui-route-persistence.skill.md)
- [MaintainConfigAutoSync](../skills/maintain-config-auto-sync.skill.md)

## Domain Knowledge

### Context Hierarchy

Full structure in `packages/ui/src/app/app.tsx`:

```tsx
return (
  <MemoryPersistenceRouter initialRoute={initialRoute}>
    <ConfigProvider {...loadedConfig}>
      <GeneratedStylesProvider>
        <Routes>
          <Route path="/" element={<Form />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </GeneratedStylesProvider>
    </ConfigProvider>
  </MemoryPersistenceRouter>
);
```

There is no `StatusProvider` — references to it in older instructions are stale and should be ignored.

### `Config` Interface

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

### Auto-Sync Contract

Every call to `saveConfig(partialConfig)` in `ConfigProvider`:

1. Merges the partial update into React state via individual `setState` calls
2. Immediately calls `messageMainThread({ type: 'save-config', ...fullConfig })`

There is no debounce or batching — every change fires a save message.

```tsx
// Simplified excerpt showing the pattern
const saveConfig = (config: Partial<Config>): void => {
  const _authToken = config.authToken ?? authToken;
  // ... resolve all fields against current state
  setAuthToken(config.authToken ?? _authToken);
  // ... set all other state fields
  messageMainThread({
    type: 'save-config',
    provider: _provider,
    repoPath: _repoPath,
    filePath: _filePath,
    branchName: _branchName,
    authToken: _authToken,
    instanceUrl: _instanceUrl,
    format: _format,
    useCombinatorialParsing: _useCombinatorialParsing,
    generateSemanticColorUtilities: _generateSemanticColorUtilities,
    outputMode: _outputMode,
  });
};
```

### `useOnPluginMessage` Pattern

```typescript
type MsgFor<TType extends MessageToUIPayload['type']> = Extract<
  MessageToUIPayload,
  { type: TType }
>;

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
    return () => {
      window.removeEventListener('message', listener);
    };
  }, [type, callback]);
}
```

- Subscribes to `window` `'message'` events, filters by `pluginMessage.type === type`
- Automatically removes listener on component unmount

### `useRoutePersistence` Behavior

- In Figma plugin UI: reads `window.__INITIAL_ROUTE__` (injected by main thread from clientStorage)
- In browser dev mode: reads `localStorage.getItem('memoryRouterPath')`
- Fallback: returns `'/'`

```tsx
export const useRoutePersistence = () => {
  const initialRoute = useMemo<string>(() => {
    if (isFigmaPluginUI()) {
      // Figma plugin UI: route injected by main thread from clientStorage
      return window.__INITIAL_ROUTE__ || '/';
    } else {
      // Browser dev mode: sync read from localStorage
      const v = window.localStorage.getItem('memoryRouterPath');
      return v || '/';
    }
  }, []);

  return initialRoute;
};
```

### `ConfigProvider` Initialization

`ConfigProvider` does **not** receive its initial values from props at app startup. `app.tsx`:

1. Calls `useOnPluginMessage('config-loaded', ...)` and stores the payload in a `loadedConfig` state variable (initially `null`).
2. Renders a loading state while `loadedConfig === null`.
3. Once the `config-loaded` message arrives, spreads the full `Config` object into `<ConfigProvider {...loadedConfig}>`.

The props therefore act as a one-time seed at first mount (after the message), not live-controlled props.

### `useRoutePersistence` Return Type

Returns `string` — the initial route path computed synchronously via `useMemo`. It is never an object or a full router location.

### `GeneratedStyles` Interface and Provider

```tsx
export interface GeneratedStyles {
  loading: boolean;
  generatedStyles: string;
  warnings: string[];
}

export const GeneratedStylesProvider: FC<GeneratedStylesProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedStyles, setGeneratedStyles] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const value = useMemo(
    () => ({
      loading,
      generatedStyles,
      warnings,
      setLoading,
      setGeneratedStyles,
      setWarnings,
    }),
    [loading, generatedStyles, warnings],
  );

  return (
    <GeneratedStylesContext.Provider value={value}>{children}</GeneratedStylesContext.Provider>
  );
};
```

### Hook Guard Pattern

Each context hook (`useConfig`, `useGeneratedStyles`) throws an error if called outside its provider:

```typescript
export const useConfig = (): ConfigType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};

export const useGeneratedStyles = (): GeneratedStylesType => {
  const ctx = useContext(GeneratedStylesContext);
  if (!ctx) {
    throw new Error('useGeneratedStyles must be used within a GeneratedStylesProvider');
  }
  return ctx;
};
```

### State Integration Examples

**Configuration in form components** — field inputs read and write directly through `useConfig()`:

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

**Output display** — combines `useGeneratedStyles()` and `useOnPluginMessage()` to react to plugin events:

```tsx
export const Output: FC = () => {
  const { generatedStyles, setGeneratedStyles } = useGeneratedStyles();
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  useOnPluginMessage('output-styles', (msg) => {
    setHighlightedCode(highlightCode(msg.styles));
    setGeneratedStyles(msg.styles);
  });

  return (
    <div id="output">
      <pre dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </div>
  );
};
```

## TODO — Needs Investigation

- [ ] Confirm whether `localStorage` write for route happens in a hook or the route component
- [ ] Document `packages/ui/src/app/utils/` contents — what utilities exist beyond `messageMainThread` and `isFigmaPluginUI`?
- [ ] Document role of `packages/ui/src/app/routes/Setup/hooks/useSetupForm.ts` — is this state management or form concern?
- [ ] Clarify whether `GeneratedStylesProvider` state is reset between generation runs or accumulated
