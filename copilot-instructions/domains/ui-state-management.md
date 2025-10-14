# UI State Management Domain

## Overview

The UI state management domain handles all client-side state through React Context providers and custom hooks. This system ensures type-safe state management with clear separation of concerns across configuration, generated content, and UI status.

## Context Provider Architecture

### Multi-Provider Hierarchy

The app uses a nested provider structure in `packages/ui/src/app/app.tsx`:

```tsx
return (
  <MemoryPersistenceRouter initialRoute={initialRoute}>
    <GeneratedStylesProvider>
      <StatusProvider>
        <ConfigProvider {...loadedConfig}>
          <Routes>
            <Route path="/" element={<Form />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </ConfigProvider>
      </StatusProvider>
    </GeneratedStylesProvider>
  </MemoryPersistenceRouter>
);
```

### Configuration Management

**ConfigProvider** handles all user configuration:

```tsx
export interface Config {
  repoPath: string;
  filePath: string;
  branchName: string;
  githubToken: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
}

export const ConfigProvider: FC<ConfigProps> = ({
  children,
  repoPath: pRepoPath = '',
  filePath: pFilePath = '',
  branchName: pBranchName = '',
  githubToken: pGithubToken = '',
  format: pFormat = 'scss',
  useCombinatorialParsing: pUseComb = true,
}) => {
  const [repoPath, setRepoPath] = useState<string>(pRepoPath ?? '');
  const [filePath, setFilePath] = useState<string>(pFilePath ?? '');
  // ... other state

  // Auto-save configuration changes
  useEffect(() => {
    messageMainThread({
      type: 'save-config',
      repoPath,
      filePath,
      branchName,
      githubToken,
      format,
      useCombinatorialParsing,
    });
  }, [repoPath, filePath, branchName, githubToken, format, useCombinatorialParsing]);
};
```

### Generated Styles Management

**GeneratedStylesProvider** manages output and loading states:

```tsx
export interface GeneratedStyles {
  loading: boolean;
  generatedStyles: string;
}

export const GeneratedStylesProvider: FC<GeneratedStylesProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedStyles, setGeneratedStyles] = useState<string>('');

  const value = useMemo(
    () => ({
      loading,
      generatedStyles,
      setLoading,
      setGeneratedStyles,
    }),
    [loading, generatedStyles],
  );

  return (
    <GeneratedStylesContext.Provider value={value}>{children}</GeneratedStylesContext.Provider>
  );
};
```

## Custom Hook Pattern

### Type-Safe Context Access

All contexts are accessed via custom hooks that enforce provider presence:

```tsx
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

### Plugin Message Handling

**useOnPluginMessage** provides type-safe message handling:

```tsx
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

## State Integration Examples

### Configuration in Form Components

Form inputs directly connect to configuration context:

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

### Output Display Integration

Generated styles connect to both message handling and context:

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

## Route Persistence

### Memory Router with Persistence

Custom router maintains route state across plugin sessions:

```tsx
export const useRoutePersistence = (): string => {
  const [initialRoute, setInitialRoute] = useState<string>('/');

  useEffect(() => {
    const getInitialRoute = () => {
      if (isFigmaPluginUI()) {
        // Route is injected during build
        return (window as any).__INITIAL_ROUTE__ || '/';
      }
      return '/';
    };

    setInitialRoute(getInitialRoute());
  }, []);

  return initialRoute;
};
```

## Status Management

### Component-Level Status Context

Some components maintain their own status context:

```tsx
type StatusType = 'idle' | 'creating-pr' | 'pr-created';

export const StatusProvider: FC<StatusProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<StatusType>('idle');

  const value = useMemo<StatusContextValue>(
    () => ({
      status,
      setIdle: () => setStatus('idle'),
      setCreatingPR: () => setStatus('creating-pr'),
      setPRCreated: () => setStatus('pr-created'),
    }),
    [status],
  );

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
};
```

This state management architecture ensures predictable data flow, type safety, and clear separation between different application concerns.
