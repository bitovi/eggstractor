# Figma Plugin Orchestration Domain

## Overview
The main entry point and orchestration layer for the Figma plugin, handling UI communication and coordinating the design token extraction process.

## Core Implementation

### Main Plugin Entry Point (`src/code.ts`)
```typescript
// Main generation function with strategy pattern for format selection
async function generateStyles(
  format: 'scss' | 'css' | 'tailwind-scss' | 'tailwind-v4',
): Promise<TransformerResult> {
  // Progress reporting
  figma.ui.postMessage({ type: 'progress-start' });
  
  // Token collection with progress callbacks
  const tokens = await collectTokens((progress, message) => {
    figma.ui.postMessage({
      type: 'progress-update', progress, message
    });
  });
  
  // Strategy pattern for format transformation
  switch (format) {
    case 'scss': return transformToScss(tokens);
    case 'css': return transformToCss(tokens);
    case 'tailwind-scss': return transformToTailwindSassClass(tokens);
    case 'tailwind-v4': return transformToTailwindLayerUtilityClassV4(tokens);
  }
}

// Event-driven message handling
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-styles') {
    const result = await generateStyles(msg.format || 'scss');
    // Store and send results
  } else if (msg.type === 'save-config') {
    // Configuration persistence
  } else if (msg.type === 'create-pr') {
    // GitHub integration
  }
};
```

## Key Patterns

### 1. Event-Driven Architecture
- **Message Passing**: Communication between plugin core and UI
- **Command Pattern**: Different message types trigger specific actions
- **Async Coordination**: All operations are asynchronous with proper error handling

### 2. Strategy Pattern for Output Formats
```typescript
// Format strategies are interchangeable
const formatStrategies = {
  scss: transformToScss,
  css: transformToCss,
  'tailwind-scss': transformToTailwindSassClass,
  'tailwind-v4': transformToTailwindLayerUtilityClassV4
};
```

### 3. Progress Reporting Pattern
```typescript
// Observer pattern for progress updates
const tokens = await collectTokens((progress, message) => {
  if (Date.now() - lastProgressTime > 500) {
    figma.ui.postMessage({
      type: 'progress-update', progress, message
    });
  }
});
```

## Responsibilities

1. **Plugin Lifecycle Management**
   - Initialize UI with proper dimensions and theming
   - Handle plugin shutdown and cleanup
   - Manage plugin state across operations

2. **Message Routing**
   - Route UI messages to appropriate handlers
   - Coordinate between different subsystems
   - Provide unified error handling

3. **Format Strategy Coordination**
   - Select appropriate transformation strategy
   - Validate format parameters
   - Handle format-specific options

4. **Progress and Error Management**
   - Report progress to UI with throttling
   - Collect and propagate errors/warnings
   - Provide user-friendly error messages

## Integration Points

- **Design Token Extraction**: Calls `collectTokens()` from services
- **Output Transformation**: Delegates to transformer strategies
- **GitHub Integration**: Coordinates with GitHub service for PR creation
- **UI Communication**: Manages bidirectional message passing

## Configuration Management

### Persistent Storage Pattern
```typescript
// Configuration is stored per Figma file
const saveConfig = async (config) => {
  await Promise.all([
    Github.saveToken(config.githubToken),
    Github.saveBranchName(config.branchName),
    Github.saveGithubConfig({
      repoPath: config.repoPath,
      filePath: config.filePath,
      outputFormat: config.format
    })
  ]);
};
```

## Error Handling Strategy

1. **Graceful Degradation**: Operations continue even if non-critical components fail
2. **User Feedback**: All errors are converted to user-friendly messages
3. **Logging**: Development builds include detailed error logging
4. **Recovery**: System attempts to recover from transient errors

## Performance Considerations

- **Throttled Updates**: Progress updates are throttled to prevent UI flooding
- **Async Operations**: All heavy operations are asynchronous
- **Memory Management**: Generated styles are stored efficiently
- **Cancellation**: Long-running operations can be interrupted
