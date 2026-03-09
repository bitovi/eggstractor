# Skill: SendPluginMessage

## Purpose

Dispatch a typed `MessageToMainThreadPayload` message from the UI iframe to the Figma plugin main thread.

## Implementation

- File: `packages/ui/src/app/utils/` (exact file TBD — likely `message-main-thread.ts` or similar)
- Function: `messageMainThread(payload: MessageToMainThreadPayload): void`

## Input

```typescript
payload: MessageToMainThreadPayload;
// Union of: LoadConfigPayload | CreatePRPayload | SaveConfigPayload | GenerateStylesPayload
//           | SelectNodePayload | ProgressUpdatedPayload | ExportTestDataPayload | RouteSetPayload
```

## Output

`void` — fire-and-forget

## Key Behaviors

- In Figma plugin UI environment (`isFigmaPluginUI() === true`): calls `parent.postMessage({ pluginMessage: payload }, '*')`
- In browser dev mode (`isFigmaPluginUI() === false`): no-op or mock fallback
- `isFigmaPluginUI()` check: looks for `window.parent !== window` or a Figma-specific global

## Common Usage Pattern

```typescript
messageMainThread({ type: 'save-config', ...configFields });
messageMainThread({ type: 'generate-styles', format, useCombinatorialParsing, ... });
messageMainThread({ type: 'create-pr', provider, authToken, repoPath, ... });
```

## TODO

- [ ] Read `packages/ui/src/app/utils/` to confirm file name and exact implementation
- [ ] Document `isFigmaPluginUI()` detection logic
- [ ] Document mock behavior in browser dev mode (console.log? localStorage write?)
- [ ] Confirm whether `messageMainThread` is synchronous or returns a Promise
