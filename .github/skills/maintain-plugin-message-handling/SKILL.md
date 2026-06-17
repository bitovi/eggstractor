---
name: maintain-plugin-message-handling
description: Provides an agent with the knowledge needed to safely modify, debug, or extend the plugin message handling hook without breaking type-safe subscriptions or listener cleanup.
---

# Skill: MaintainPluginMessageHandling

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the plugin message handling hook without breaking type-safe subscriptions or listener cleanup.

## Implementation

- File: `packages/ui/src/app/hooks/useOnPluginMessage/useOnPluginMessage.ts`
- Export: `useOnPluginMessage<TType>(type, callback): void`

## Input

```typescript
type TType = MessageToUIPayload['type']
// 'output-styles' | 'progress-update' | 'progress-start' | 'progress-end'
// | 'config-saved' | 'config-loaded' | 'pr-creating' | 'pr-created' | 'error' | 'test-data-exported'

type: TType
callback: (msg: MsgFor<TType>) => void
```

Where `MsgFor<TType>` is a discriminated extract of the union:

```typescript
type MsgFor<TType extends MessageToUIPayload['type']> = Extract<
  MessageToUIPayload,
  { type: TType }
>;
```

## Output

`void` — hook with side effects

## Key Behaviors

- Uses `useEffect` to add a `window.addEventListener('message', handler)` listener
- Handler reads `event.data.pluginMessage` and filters by `pluginMessage.type === type`
- Listener removed on component unmount (cleanup function in `useEffect`)
- Callback is type-safe — receives the narrowed message type, not the full union

## Common Usage Pattern

```typescript
useOnPluginMessage('output-styles', (msg) => {
  setGeneratedStyles(msg.styles); // msg is OutputStylesPayload
});

useOnPluginMessage('config-loaded', (msg) => {
  saveConfig(msg.config); // msg is ConfigLoadedPayload
});

useOnPluginMessage('progress-update', (msg) => {
  updateProgress(msg.progress, msg.message);
});
```

## TODO

- [ ] Confirm whether callback identity changes cause effect re-subscriptions (useCallback required by callers?)
- [ ] Document behavior when multiple components subscribe to the same message type
- [ ] Document whether the hook works in browser dev mode (window.onmessage mock?)
