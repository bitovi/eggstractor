# Figma Plugin Core Style Guide

## Overview
This style guide covers the main plugin entry point files that handle Figma Plugin API integration and core orchestration logic.

## File Structure
```
src/code.ts       - Main plugin entry point and message handling
manifest.json     - Figma plugin configuration and metadata
```

## Code Style Standards

### 1. Plugin API Integration
```typescript
// ✅ Good: Proper plugin initialization with configuration
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: 'Eggstractor',
});

// ❌ Bad: Hardcoded or missing configuration
figma.showUI(__html__);
```

### 2. Message Handling Pattern
```typescript
// ✅ Good: Structured message handling with type checking
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'generate-styles':
      const result = await generateStyles(msg.format || 'scss');
      // Handle result...
      break;
    
    case 'save-config':
      await Promise.all([
        Github.saveToken(msg.githubToken),
        Github.saveBranchName(msg.branchName),
        // ...other config operations
      ]);
      figma.ui.postMessage({ type: 'config-saved' });
      break;
    
    default:
      console.warn(`Unknown message type: ${msg.type}`);
  }
};

// ❌ Bad: Unstructured message handling
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-styles') {
    // Handle without proper error handling or structure
  }
  if (msg.type === 'save-config') {
    // Handle without proper async coordination
  }
};
```

### 3. Error Handling Strategy
```typescript
// ✅ Good: Comprehensive error handling with user feedback
try {
  const result = await Github.createGithubPR(
    msg.githubToken,
    msg.repoPath,
    msg.filePath,
    msg.branchName,
    generatedScss,
  );
  figma.ui.postMessage({
    type: 'pr-created',
    prUrl: result.prUrl,
  });
} catch (error) {
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  figma.ui.postMessage({ type: 'error', message });
  console.error('GitHub PR creation failed:', error);
}

// ❌ Bad: Missing error handling or poor error messages
const result = await Github.createGithubPR(/* ... */);
figma.ui.postMessage({ type: 'pr-created', prUrl: result.prUrl });
```

### 4. Progress Reporting
```typescript
// ✅ Good: Throttled progress updates with meaningful messages
let lastProgressTime = 0;
const tokens = await collectTokens((progress, message) => {
  const now = Date.now();
  
  if (now - lastProgressTime > 500) { // Throttle to prevent UI flooding
    lastProgressTime = now;
    figma.ui.postMessage({
      type: 'progress-update',
      progress: Math.round(progress),
      message,
    });
  }
});

// ❌ Bad: Unthrottled or missing progress updates
const tokens = await collectTokens((progress, message) => {
  figma.ui.postMessage({ type: 'progress-update', progress, message });
});
```

### 5. State Management
```typescript
// ✅ Good: Clear state management with proper scoping
let generatedContent: string = '';

async function generateStyles(format: OutputFormat): Promise<TransformerResult> {
  // Send progress start
  figma.ui.postMessage({ type: 'progress-start' });
  
  const result = await processTokens(format);
  generatedContent = result.result; // Store for later use
  
  return result;
}

// ❌ Bad: Global state without clear management
var output = '';
function generate() {
  // Unclear state management
}
```

## Naming Conventions

### Functions
- Use descriptive verb-noun combinations
- Async functions should be clearly named
```typescript
// ✅ Good
async function generateStyles(format: string): Promise<TransformerResult>
async function saveConfiguration(config: Config): Promise<void>
function handleUserMessage(message: PluginMessage): void

// ❌ Bad
async function generate(f: string)
function save(c: any)
function handle(m: any)
```

### Variables
- Use clear, descriptive names
- Prefix boolean variables with 'is', 'has', 'can', etc.
```typescript
// ✅ Good
const generatedStylesheet: string = '';
const isProcessingComplete: boolean = false;
const hasValidConfiguration: boolean = true;

// ❌ Bad
const output: string = '';
const done: boolean = false;
const valid: boolean = true;
```

## Manifest.json Standards

### 1. Required Fields
```json
{
  "name": "Eggstractor",
  "id": "1464625803208186094",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "capabilities": [],
  "enableProposedApi": false,
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["https://api.github.com"]
  }
}
```

### 2. Networking Configuration
```json
// ✅ Good: Specific domain allowlist
"networkAccess": {
  "allowedDomains": [
    "https://api.github.com"
  ]
}

// ❌ Bad: Overly broad or missing network access
"networkAccess": {
  "allowedDomains": ["*"]
}
```

### 3. Capabilities Declaration
```json
// ✅ Good: Only request needed capabilities
"capabilities": []

// ❌ Bad: Requesting unnecessary capabilities
"capabilities": ["currentuser", "fileread"]
```

## Performance Guidelines

### 1. Async Operation Management
```typescript
// ✅ Good: Proper async/await with error handling
async function initializePlugin(): Promise<void> {
  try {
    figma.ui.postMessage({ type: 'progress-start' });
    
    const [config, tokens] = await Promise.all([
      loadConfiguration(),
      collectTokens(updateProgress)
    ]);
    
    figma.ui.postMessage({ type: 'initialization-complete', config, tokens });
  } catch (error) {
    figma.ui.postMessage({ type: 'error', message: error.message });
  }
}

// ❌ Bad: Blocking operations or poor async handling
function initializePlugin() {
  const config = loadConfiguration(); // Blocking
  const tokens = collectTokens(); // No progress updates
  figma.ui.postMessage({ type: 'complete' });
}
```

### 2. Memory Management
```typescript
// ✅ Good: Clean up resources and avoid memory leaks
let processingCache: Map<string, any> | null = new Map();

function cleanup(): void {
  if (processingCache) {
    processingCache.clear();
    processingCache = null;
  }
}

// Register cleanup
figma.on('close', cleanup);

// ❌ Bad: No cleanup or resource management
const cache = new Map(); // Never cleaned up
```

## Testing Standards

### 1. Plugin Core Testing
```typescript
// ✅ Good: Mock Figma API for testing
describe('Plugin Core', () => {
  let mockFigma: Partial<PluginAPI>;
  
  beforeEach(() => {
    mockFigma = {
      ui: {
        postMessage: jest.fn(),
        onmessage: null
      },
      showUI: jest.fn(),
      closePlugin: jest.fn()
    };
    
    global.figma = mockFigma as PluginAPI;
  });
  
  afterEach(() => {
    delete global.figma;
  });
  
  it('should initialize UI with correct parameters', () => {
    initializePlugin();
    
    expect(mockFigma.showUI).toHaveBeenCalledWith(
      expect.any(String),
      {
        width: 600,
        height: 1200,
        themeColors: true,
        title: 'Eggstractor'
      }
    );
  });
});
```

## Security Guidelines

### 1. Input Validation
```typescript
// ✅ Good: Validate all incoming messages
function validateMessage(msg: any): msg is PluginMessage {
  return msg && 
         typeof msg.type === 'string' &&
         ['generate-styles', 'save-config', 'create-pr'].includes(msg.type);
}

figma.ui.onmessage = async (msg) => {
  if (!validateMessage(msg)) {
    console.warn('Invalid message received:', msg);
    return;
  }
  
  // Process validated message
};

// ❌ Bad: No input validation
figma.ui.onmessage = async (msg) => {
  // Directly use msg properties without validation
  const result = await processMessage(msg.type, msg.data);
};
```

### 2. Safe Error Reporting
```typescript
// ✅ Good: Sanitize error messages before sending to UI
function createSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose sensitive internal details
    return error.message.replace(/\b\w+:\/\/[^\s]+/g, '[URL]');
  }
  return 'An unexpected error occurred';
}

// ❌ Bad: Expose raw error details
figma.ui.postMessage({ 
  type: 'error', 
  message: error.stack // Might contain sensitive information
});
```

## Documentation Standards

### 1. Function Documentation
```typescript
/**
 * Generates design tokens in the specified format
 * @param format - Output format ('scss' | 'css' | 'tailwind-scss' | 'tailwind-v4')
 * @returns Promise that resolves to transformer result with styles, warnings, and errors
 * @throws {Error} When format is not supported or token collection fails
 */
async function generateStyles(
  format: 'scss' | 'css' | 'tailwind-scss' | 'tailwind-v4'
): Promise<TransformerResult> {
  // Implementation...
}
```

### 2. Message Type Documentation
```typescript
/**
 * Plugin message types and their expected payloads
 */
interface PluginMessages {
  'generate-styles': {
    format?: 'scss' | 'css' | 'tailwind-scss' | 'tailwind-v4';
  };
  
  'save-config': {
    githubToken: string;
    branchName: string;
    repoPath: string;
    filePath: string;
    format: string;
  };
  
  'create-pr': {
    githubToken: string;
    repoPath: string;
    filePath: string;
    branchName: string;
  };
}
```

## File Organization

### Import Order
```typescript
// 1. External libraries (none in this case for plugin core)
// 2. Internal services and utilities
import { collectTokens } from './services';
import {
  transformToScss,
  transformToCss,
  transformToTailwindLayerUtilityClassV4,
  transformToTailwindSassClass,
} from './transformers';
import Github from './github';
import { serializeFigmaData } from './utils/test.utils';

// 3. Types
import { TransformerResult } from './types/processors';
```

### Code Organization
```typescript
// 1. Global variables and constants
let generatedScss: string = '';

// 2. Plugin initialization
figma.showUI(__html__, { /* config */ });

// 3. Core functions
async function generateStyles(format: string): Promise<TransformerResult> {
  // Implementation
}

// 4. Event handlers
figma.ui.onmessage = async (msg) => {
  // Message handling
};
```
