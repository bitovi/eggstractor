# Figma Plugin Architecture Domain

## Overview

Eggstractor implements a traditional Figma plugin architecture with a strict separation between the main thread and UI iframe. This domain governs all communication, data persistence, and lifecycle management within the Figma plugin environment.

## Main Thread Implementation

### Entry Point and Initialization

The main thread entry point is in `packages/figma/src/index.ts`:

```typescript
const main = async () => {
  const postMessageToUI = (message: MessageToUIPayload) => {
    figma.ui.postMessage(message);
  };

  let generatedScss = '';
  const route: string = (await figma.clientStorage.getAsync('route')) || '/';

  // Replace placeholder in HTML build with initial route
  const html = __html__.replace('null; /* __INITIAL_ROUTE_PLACEHOLDER__ */', JSON.stringify(route));

  // Show the UI with resizable window
  figma.showUI(html, {
    width: 600,
    height: 1200,
    themeColors: true,
    title: 'Eggstractor',
  });
};
```

### Message Handling Pattern

All UI-to-main communication follows a structured message handler:

```typescript
figma.ui.onmessage = async (msg: MessageToMainThreadPayload) => {
  if (msg.type === 'generate-styles') {
    const result = await generateStyles(
      getValidStylesheetFormat(msg.format),
      msg.useCombinatorialParsing,
    );
    generatedScss = result.result;
    postMessageToUI({
      type: 'output-styles',
      styles: result.result,
      warnings: result.warnings,
      errors: result.errors,
    });
  } else if (msg.type === 'save-config') {
    // Handle configuration persistence
  } else if (msg.type === 'load-config') {
    // Handle configuration loading
  }
  // Additional message types...
};
```

### Progress Communication

Progress updates use a sophisticated tracking system to ensure UI responsiveness:

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

  postMessageToUI({
    type: 'progress-update',
    progress,
    message,
    id,
  });

  return progressUpdated;
}
```

## UI Thread Implementation

### Message Reception Pattern

The UI uses a custom hook for type-safe message handling:

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

### Message Transmission Utility

UI components send messages using a centralized utility:

```typescript
export const messageMainThread = (message: MessageToMainThreadPayload) => {
  if (isFigmaPluginUI()) {
    parent.postMessage({ pluginMessage: message }, '*');
  } else {
    // Handle development mode differently
    mockPostMessageToMainThread(message);
  }
};
```

## Data Persistence Patterns

### File-Scoped Storage

All persistent data is scoped to individual Figma files using unique identifiers:

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

### Client Storage Management

Configuration and tokens are stored per-file in client storage:

```typescript
saveToken: async function (token: string) {
  const fileId = getFileId();
  const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
  const tokens = JSON.parse(userTokens);

  tokens[fileId] = token;
  await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
}
```

### Plugin Data vs Client Storage

- **Plugin Data**: Used for file-specific data that travels with the file (`customFileId`, `githubConfig`)
- **Client Storage**: Used for user-specific data across sessions (`fileTokens`, `fileBranches`, `route`)

## Development Environment Support

### Mock Figma Environment

For development, a comprehensive mock environment simulates the plugin:

```typescript
const mockFigma = () => {
  // Mock message handler
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
};
```

## Architecture Constraints

### Thread Separation Rules

1. **Main Thread**:
   - Can access Figma API and Node.js-like APIs
   - Cannot access DOM or React
   - Must handle all Figma node processing

2. **UI Thread**:
   - Can access DOM and React
   - Cannot directly access Figma API
   - Must communicate via message passing

### Message Type Safety

All communication must use strictly typed message interfaces:

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

## Plugin Manifest Integration

The plugin configuration defines the architectural boundaries:

```json
{
  "name": "eggstractor",
  "main": "packages/figma/dist/index.js",
  "ui": "packages/ui/dist/index.html",
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": ["https://api.github.com"]
  }
}
```

This architecture ensures secure, performant communication between the Figma API and the React UI while maintaining clear separation of concerns and type safety throughout the plugin.
