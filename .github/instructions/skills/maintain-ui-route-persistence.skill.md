# Skill: MaintainUIRoutePersistence

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend UI route persistence without breaking the read/write contract between the UI and main thread.

## Implementation — Read Side

- File: `packages/ui/src/app/hooks/useRoutePersistence/useRoutePersistence.ts`
- Export: `useRoutePersistence(): string`
- Returns: initial route string (e.g., `'/'`, `'/export'`, `'/components'`)

## Implementation — Write Side

- Sending route: `messageMainThread({ type: 'set-route', path: currentPath })`
- Main thread stores path in `figma.clientStorage`
- On next plugin open: main thread reads path and injects into `window.__INITIAL_ROUTE__`

## Output (Read)

```typescript
string; // route path to initialize router with
```

## Environment Behavior

```
Figma plugin UI  → reads window.__INITIAL_ROUTE__ (injected at plugin startup)
Browser dev mode → reads localStorage.getItem('memoryRouterPath')
Fallback         → '/'
```

## Known Routes

```
'/'            → Setup
'/export'      → Export
'/components'  → Components
'/about'       → About
```

## TODO

- [ ] Confirm exact `window.__INITIAL_ROUTE__` injection mechanism in main thread (string template or dynamic assignment?)
- [ ] Document where the `'set-route'` message is dispatched in the UI — router `onNavigate` callback?
- [ ] Document browser dev mode `localStorage` key name
- [ ] Document whether route is read synchronously or asynchronously (affects router initialization)
