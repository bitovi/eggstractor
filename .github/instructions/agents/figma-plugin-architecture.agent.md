# Agent: FigmaPluginArchitectureAgent

## Purpose

Owns the plugin communication layer: main-thread lifecycle (`packages/figma/src/index.ts`), typed message passing between the Figma main thread and the UI iframe, progress tracking, client storage management, and mock development environment setup.

## Source Files

- `packages/figma/src/index.ts` — main thread entry point
- `packages/common/src/types/message-to-main-thread-payload.ts` — all inbound message types
- `packages/common/src/types/message-to-ui-payload.ts` — all outbound message types
- `packages/ui/src/app/hooks/useOnPluginMessage/` — UI-side message subscription
- `packages/ui/src/app/utils/` — `messageMainThread()`, `isFigmaPluginUI()`

## Skills Used

- [MaintainPluginMessageSending](../skills/maintain-plugin-message-sending.skill.md)
- [MaintainPluginMessageHandling](../skills/maintain-plugin-message-handling.skill.md)
- [MaintainUIRoutePersistence](../skills/maintain-ui-route-persistence.skill.md)

## Domain Knowledge

### Main Thread Initialization

```typescript
const main = async () => {
  const postMessageToUI = (message: MessageToUIPayload) => {
    figma.ui.postMessage(message);
  };

  let generatedScss = '';
  const route: string = (await figma.clientStorage.getAsync('route')) || '/';

  const html = __html__.replace('null; /* __INITIAL_ROUTE_PLACEHOLDER__ */', JSON.stringify(route));

  figma.showUI(html, {
    width: 600,
    height: 900,
    themeColors: true,
    title: 'Eggstractor',
  });
};
```

### Message Direction

```
UI iframe  →  Main Thread   MessageToMainThreadPayload
Main Thread →  UI iframe    MessageToUIPayload
```

### `MessageToMainThreadPayload` Union

| `type`               | Payload type             | Description                                                                                                             |
| -------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `'load-config'`      | `LoadConfigPayload`      | Request stored git-provider config from `clientStorage`                                                                 |
| `'save-config'`      | `SaveConfigPayload`      | Persist git-provider config to `clientStorage`                                                                          |
| `'generate-styles'`  | `GenerateStylesPayload`  | Trigger token collection + stylesheet transform; fields: `format: StylesheetFormat`, `useCombinatorialParsing: boolean` |
| `'create-pr'`        | `CreatePRPayload`        | Create a pull/merge request via the git provider                                                                        |
| `'export-test-data'` | `ExportTestDataPayload`  | Serialize `figma.currentPage` for test fixture creation                                                                 |
| `'select-node'`      | `SelectNodePayload`      | Select a node in Figma and scroll the viewport to it; field: `nodeId: string`                                           |
| `'progress-updated'` | `ProgressUpdatedPayload` | **ACK from UI** — confirms a `progress-update` frame has rendered; field: `id: number`                                  |
| `'set-route'`        | `RouteSetPayload`        | Persist the current UI route to `clientStorage`; field: `path: string`                                                  |

### `MessageToUIPayload` Union

| `type`                 | Payload type              | Description                                                                              |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `'output-styles'`      | `OutputStylesPayload`     | Generated stylesheet; fields: `styles: string`, `warnings: string[]`, `errors: string[]` |
| `'progress-update'`    | `ProgressUpdatePayload`   | Incremental progress; fields: `progress: number`, `message: string`, `id: number`        |
| `'progress-start'`     | `ProgressStartPayload`    | Signals start of a long operation                                                        |
| `'progress-end'`       | `ProgressEndPayload`      | Signals completion of a long operation                                                   |
| `'config-saved'`       | `ConfigSavedPayload`      | Confirmation that config was persisted                                                   |
| `'config-loaded'`      | `ConfigLoadedPayload`     | Returns stored config after a `load-config` request                                      |
| `'pr-creating'`        | `PRCreatingPayload`       | Optimistic notification sent immediately before the API call begins                      |
| `'pr-created'`         | `PRCreatedPayload`        | Success result of PR creation; field: `prUrl: string`                                    |
| `'error'`              | `ErrorPayload`            | Unhandled error from main thread; field: `message: string`                               |
| `'test-data-exported'` | `TestDataExportedPayload` | Serialized current page data; field: `data: string` (JSON string)                        |

### Progress Protocol

1. Main thread sends `{ type: 'progress-start' }` before long operation
2. Main thread sends `{ type: 'progress-update', progress: number, message: string, id: number }` repeatedly
3. UI renders the frame, then **ACKs** by sending `{ type: 'progress-updated', id }` back to the main thread
4. Main thread resolves the pending promise in `progressUpdateTasks[id]`, allowing the next step to proceed
5. Main thread sends `{ type: 'progress-end' }` on completion
6. Progress is capped at `MAX_PROGRESS_PERCENTAGE` (95) during `collectTokens()`; last 5% reserved for the transform step

#### `updateProgress()` Implementation

```typescript
let progressUpdateIdCount = 0;
const progressUpdateTasks: Record<number, null | (() => void)> = {};

function updateProgress(progress: number, message: string): Promise<void> {
  const id = ++progressUpdateIdCount;

  let resolve: () => void;
  const progressUpdated = new Promise<void>((res) => {
    resolve = res;
  });
  progressUpdateTasks[id] = () => {
    resolve();
  };

  postMessageToUI({ type: 'progress-update', progress, message, id });

  return progressUpdated;
}
```

ACK resolver (inside `figma.ui.onmessage`):

```typescript
} else if (msg.type === 'progress-updated') {
  const resolve = progressUpdateTasks[msg.id];
  if (!resolve) {
    throw new Error(`No progress update handler found for ID: ${msg.id}`);
  }
  resolve();
  progressUpdateTasks[msg.id] = null; // clear after resolving
}
```

### `select-node` Handler

When the UI sends `{ type: 'select-node', nodeId: string }`, the main thread:

1. Resolves the node via `figma.getNodeByIdAsync(nodeId)`
2. Sets `figma.currentPage.selection = [node]`
3. Calls `figma.viewport.scrollAndZoomIntoView([node])`

Only works on `SceneNode` instances; non-scene nodes are silently ignored.

```typescript
} else if (msg.type === 'select-node') {
  const node = await figma.getNodeByIdAsync(msg.nodeId);
  if (node && 'type' in node) {
    figma.currentPage.selection = [node as SceneNode];
    figma.viewport.scrollAndZoomIntoView([node]);
  }
}
```

### `export-test-data` Handler

Serializes `figma.currentPage` using `serializeFigmaData()` and responds with `{ type: 'test-data-exported', data: string }` where `data` is a pretty-printed JSON string. Used to capture fixture data for unit tests.

```typescript
} else if (msg.type === 'export-test-data') {
  const testData = await serializeFigmaData(figma.currentPage);
  postMessageToUI({
    type: 'test-data-exported',
    data: JSON.stringify(testData, null, 2),
  });
}
```

### `pr-creating` / `pr-created` Sequence

The main thread sends `pr-creating` immediately before calling the git provider API, then `pr-created` (with `prUrl`) on success, or `error` on failure. This allows the UI to show an optimistic loading state.

### Route Persistence

When the UI navigates, it sends `{ type: 'set-route', path: string }` to the main thread. The main thread persists the route via `figma.clientStorage.setAsync('route', path)`. On next plugin open, the stored route is retrieved with `figma.clientStorage.getAsync('route')` (key: `'route'`, default `'/'`) and injected **via string substitution** into the HTML build before `figma.showUI()` is called:

```typescript
const html = __html__.replace('null; /* __INITIAL_ROUTE_PLACEHOLDER__ */', JSON.stringify(route));
```

There is no `window.__INITIAL_ROUTE__` global; the value is embedded directly into the HTML string.

### Message Handler Pattern (Main Thread)

```typescript
figma.ui.onmessage = async (msg: MessageToMainThreadPayload) => {
  switch (msg.type) {
    case 'generate-styles': ...
    case 'save-config': ...
    case 'load-config': ...
    case 'create-pr': ...
    case 'export-test-data': ...
    case 'select-node': ...
    case 'progress-updated': ...
    case 'set-route': ...
  }
};
```

### Plugin Window Configuration

`figma.showUI()` is called with:

```typescript
{ width: 600, height: 900, themeColors: true, title: 'Eggstractor' }
```

### Plugin Manifest (`manifest.json`)

```json
{
  "networkAccess": {
    "allowedDomains": ["*"],
    "reasoning": "Requires access to GitHub API and GitLab API (including self-hosted instances that can be any domain)"
  },
  "documentAccess": "dynamic-page",
  "editorType": ["figma", "dev"]
}
```

> **Critical:** `allowedDomains` must remain `["*"]`. Restricting it to `["https://api.github.com"]` breaks GitLab and self-hosted GitHub Enterprise support.

### Data Persistence

**Plugin Data** (travels with the Figma file, scoped per-file):

- `customFileId` — stable file identifier generated as `file_${Date.now()}_${random}` on first access
- `gitProviderConfig` — git provider configuration

**Client Storage** (user-specific, persists across sessions):

- `'route'` — last UI route visited (string, default `'/'`)
- `'fileTokens'` — JSON map of `{ [fileId]: token }` for API tokens per file
- `'fileBranches'` — branch selections per file

#### File ID Helper

```typescript
const getFileId = () => {
  let fileId = figma.root.getPluginData('customFileId');
  if (!fileId) {
    fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    figma.root.setPluginData('customFileId', fileId);
  }
  return fileId;
};
```

#### Client Storage Token Management

Tokens are stored as a JSON map keyed by file ID:

```typescript
saveToken: async function (token: string) {
  const fileId = getFileId();
  const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
  const tokens = JSON.parse(userTokens);
  tokens[fileId] = token;
  await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
}
```

### Thread Constraints

| Thread    | Can access                                                 | Cannot access      |
| --------- | ---------------------------------------------------------- | ------------------ |
| Main      | Figma API, `figma.clientStorage`, `figma.root` plugin data | DOM, React         |
| UI iframe | DOM, React hooks                                           | Figma API directly |

### Message Type Safety

All payloads extend base interfaces:

- `BaseMessageToMainThreadPayload` — base for all UI → Main messages
- `BaseMessageToUIPayload` — base for all Main → UI messages

### Mock Development Environment

In browser dev mode (`isFigmaPluginUI()` returns `false`), `messageMainThread()` routes to `mockPostMessageToMainThread()` in `packages/ui/src/mockFigma/` instead of calling `parent.postMessage`. The mock handles `load-config` by firing a `config-loaded` response with fixture data after a 500 ms timeout, allowing the full UI to render and interact without a real Figma context.

```typescript
const mockPostMessageToMainThread = (message: MessageToMainThreadPayload) => {
  if (message.type === 'load-config') {
    setTimeout(() => {
      mockPostMessageToUI({
        type: 'config-loaded',
        config: {
          repoPath: 'bitovi/mock-repo',
          branchName: 'mock-branch',
          githubToken: 'mock-github-token',
          format: 'scss',
          filePath: 'styles/mock-output.scss',
          useCombinatorialParsing: true,
        },
      });
    }, 500);
  }
};
```

### UI Thread Implementation

#### `useOnPluginMessage` Hook

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
    return () => {
      window.removeEventListener('message', listener);
    };
  }, [type, callback]);
}
```

#### `messageMainThread` Utility

```typescript
export const messageMainThread = (message: MessageToMainThreadPayload) => {
  if (isFigmaPluginUI()) {
    parent.postMessage({ pluginMessage: message }, '*');
  } else {
    mockPostMessageToMainThread(message);
  }
};
```

`isFigmaPluginUI()` returns `true` when running inside the Figma plugin iframe (detected by checking `window.parent !== window` or a Figma-specific global). When `false` (browser dev mode), calls are routed to the mock layer.

### Message Type Safety — Interface Examples

```typescript
export interface GenerateStylesPayload extends BaseMessageToMainThreadPayload {
  type: 'generate-styles';
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
}

export interface OutputStylesPayload extends BaseMessageToUIPayload {
  type: 'output-styles';
  styles: string;
  warnings: string[];
  errors: string[];
}
```
