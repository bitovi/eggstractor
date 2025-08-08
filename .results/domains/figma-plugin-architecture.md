# Figma Plugin Architecture Domain

The Figma plugin architecture domain defines how the plugin integrates with the Figma environment, handling the dual-context execution model and API constraints.

## Dual Context Architecture

The plugin operates in two separate JavaScript contexts:

1. **Main Thread** (`src/code.ts`): Has access to Figma API but no DOM
2. **UI Thread** (`src/ui.ts`): Has DOM access but no direct Figma API access

## Message Passing System

Communication between contexts uses the Figma plugin messaging API:

```typescript
// Main thread sending to UI
figma.ui.postMessage({
  type: 'progress-start',
});

// UI thread sending to main
parent.postMessage({ pluginMessage: { type: 'generate-styles', format } }, '*');
```

## Plugin Manifest Configuration

The plugin capabilities are defined in `manifest.json`:

```json
{
  "name": "eggstractor",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "documentAccess": "dynamic-page",
  "editorType": ["figma", "dev"],
  "networkAccess": {
    "allowedDomains": ["https://api.github.com"]
  }
}
```

## Current Page Scope

All operations are scoped to the current page:

```typescript
async function generateStyles(): Promise<TransformerResult> {
  figma.ui.postMessage({ type: 'progress-start' });
  
  try {
    const tokens = await collectTokens();
    // Processing limited to figma.currentPage
  }
}
```

## Plugin Data Storage

The plugin uses Figma's storage APIs for persistence:

```typescript
// File-specific data
figma.root.setPluginData('customFileId', fileId);

// User-specific data
await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
```

## Async API Pattern

All Figma API calls are asynchronous and must be awaited:

```typescript
const componentNode = await node.getMainComponentAsync();
```

## UI Window Management

The plugin UI is configured with specific dimensions and features:

```typescript
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: 'Eggstractor',
});
```

## Network Access Restrictions

Network requests are limited to domains specified in the manifest. Only GitHub API access is permitted for this plugin.
