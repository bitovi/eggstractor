# React Hooks Style Guide

## Unique Conventions in This Codebase

### Plugin Message Type Safety Pattern

**Unique Pattern**: Custom hook for type-safe Figma plugin message handling:

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
        callback(payload as MsgFor<TType>); // Type-safe callback
      }
    };
    // Cleanup pattern
  }, [type, callback]);
}
```

### Global State Access Enforcement

**Unique Pattern**: Context hooks that throw errors if used outside providers:

```tsx
export const useConfig = (): ConfigType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};
```

### Route Persistence with Dynamic Injection

**Unique Pattern**: Route state retrieved from build-time injection:

```tsx
export const useRoutePersistence = (): string => {
  const [initialRoute, setInitialRoute] = useState<string>('/');

  useEffect(() => {
    const getInitialRoute = () => {
      if (isFigmaPluginUI()) {
        return (window as any).__INITIAL_ROUTE__ || '/'; // Build-time injected
      }
      return '/';
    };
    setInitialRoute(getInitialRoute());
  }, []);

  return initialRoute;
};
```
