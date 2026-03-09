# Skill: MaintainConfigAutoSync

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the config auto-sync behavior without breaking the every-change save contract.

## Implementation

- File: `packages/ui/src/app/context/ConfigContext/ConfigContext.tsx`
- Implemented inside `ConfigProvider` → `saveConfig()` function

## Trigger

Called by components via `useConfig().saveConfig(partialConfig)`.

## Behavior

```typescript
const saveConfig = (partialConfig: Partial<Config>) => {
  // 1. Merge partialConfig into current React state
  setState((prev) => ({ ...prev, ...partialConfig }));
  // 2. Immediately dispatch save-config message to main thread
  messageMainThread({ type: 'save-config', ...mergedConfig });
};
```

## Key Contract

- **Every** call to `saveConfig()` triggers a main thread message — there is no debounce or batching
- The merged config (not just the partial) is always sent in full
- `SaveConfigPayload` shape includes all `GitProviderConfig` fields plus `format`, `useCombinatorialParsing`, `generateSemanticColorUtilities`, `outputMode`

## `SaveConfigPayload` Shape

```typescript
interface SaveConfigPayload {
  type: 'save-config';
  provider: GitProvider;
  authToken: string;
  filePath: string;
  repoPath: string;
  branchName: string;
  instanceUrl?: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}
```

## TODO

- [ ] Confirm whether state update and message dispatch are synchronous (potential stale closure issue if async)
- [ ] Document whether `saveConfig` during initial `config-loaded` processing causes duplicate saves
- [ ] Document whether there are plans to add debouncing for high-frequency field edits (e.g., typing in text inputs)
