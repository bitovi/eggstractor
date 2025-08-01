# Figma Plugin Core Style Guide

## File Structure Convention

Figma plugin core files follow a strict separation of concerns:

- `src/code.ts`: Main thread logic with Figma API access
- `src/ui.ts`: UI thread logic with DOM access  
- `manifest.json`: Plugin capabilities and configuration

## Message Passing Pattern

All communication between main and UI threads uses structured message objects:

```typescript
// From main thread to UI
figma.ui.postMessage({
  type: 'progress-start' | 'progress-end' | 'styles-generated' | 'error',
  data?: any
});

// From UI to main thread  
parent.postMessage({ 
  pluginMessage: { 
    type: 'generate-styles' | 'create-pr' | 'export-test-data',
    format?: string,
    // ...other properties
  } 
}, '*');
```

## Async Function Convention

All main thread functions that interact with Figma API must be async:

```typescript
async function generateStyles(format: string): Promise<TransformerResult> {
  // Figma API operations require await
  const tokens = await collectTokens();
}
```

## UI Initialization Pattern

The plugin UI is initialized with specific window configuration:

```typescript
figma.showUI(__html__, {
  width: 600,
  height: 1200,  
  themeColors: true,
  title: 'Eggstractor',
});
```

## Error Handling Convention

Main thread errors are caught and sent to UI via messages:

```typescript
try {
  // Plugin operations
} catch (error) {
  figma.ui.postMessage({
    type: 'error',
    message: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

## Plugin Data Storage Pattern

Use file-specific and user-specific storage appropriately:

```typescript
// File-specific data (manifest info)
figma.root.setPluginData('key', value);

// User-specific data (tokens, settings)
await figma.clientStorage.setAsync('key', value);
```
