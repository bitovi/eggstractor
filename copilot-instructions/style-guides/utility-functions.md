# Utility Functions Style Guide

## Unique Conventions in This Codebase

### Environment Detection Pattern

**Unique Pattern**: Functions detect Figma plugin vs development environment:

```tsx
export const isFigmaPluginUI = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.parent !== window &&
    typeof parent.postMessage === 'function'
  );
};
```

### Message Thread Abstraction

**Unique Pattern**: Single utility handles both plugin and mock environments:

```tsx
export const messageMainThread = (message: MessageToMainThreadPayload) => {
  if (isFigmaPluginUI()) {
    parent.postMessage({ pluginMessage: message }, '*');
  } else {
    mockPostMessageToMainThread(message);
  }
};
```
