# Eggstractor Migration to Vite + React

## Overview

The Eggstractor Figma plugin has been successfully migrated from Webpack to Vite + React, modernizing the build system and UI architecture while maintaining all existing functionality.

## Migration Summary

### What Changed

1. **Build System**: Replaced Webpack with Vite for faster builds and better development experience
2. **UI Framework**: Migrated from vanilla HTML/JS/CSS to React with TypeScript
3. **Architecture**: Maintained the dual-thread Figma plugin pattern (main thread + UI thread)
4. **Output**: Single-file HTML with inlined CSS/JS for Figma compatibility

### Key Files Added/Modified

- **Build Configuration**:
  - `vite.config.ts` - Main Vite configuration with dual build targets
  - `scripts/build-html.js` - Post-build script for Figma compatibility
  - `tsconfig.code.json`, `tsconfig.ui.json` - Separate TypeScript configs

- **React UI Structure**:
  - `src/ui/index.tsx` - Main React entry point
  - `src/ui/App.tsx` - Root App component
  - `src/ui/components/` - Reusable React components
  - `src/ui/hooks/` - Custom hooks for plugin communication
  - `src/ui/types/` - TypeScript types for UI
  - `src/ui/styles.css` - Modern CSS with Figma design tokens

- **Updated**:
  - `package.json` - Updated scripts and dependencies
  - `manifest.json` - Points to new build outputs
  - `README.md` - Updated development instructions

### Files Removed

- `webpack.config.js` - Old Webpack configuration
- `src/ui.ts` - Legacy UI JavaScript
- `src/ui.html` - Legacy UI HTML
- `src/ui.css` - Legacy UI styles

## Build Process

The new build process consists of four stages:

1. **Generate Theme** (`npm run generate-theme`): Generates theme tokens from Tailwind config
2. **Build UI** (`npm run build:ui`): Builds React UI with inlined CSS/JS using `vite-plugin-singlefile`
3. **Build Code** (`npm run build:code`): Builds main thread code as IIFE bundle
4. **Build HTML** (`npm run build:html`): Combines outputs into Figma-compatible format

### Output Structure

```
dist/
├── ui.html     # React UI with inlined CSS/JS (single file)
└── code.js     # Main thread code (IIFE bundle)
```

## Development Workflow

- **Development Build**: `npm run dev`
- **UI Development Server**: `npm run dev:ui` (runs on localhost:5173)
- **Production Build**: `npm run build`
- **Tests**: `npm test` (all existing tests pass)

## Architecture

### Main Thread (`src/code.ts`)
- Unchanged from original implementation
- Handles Figma API operations
- Processes design tokens
- Manages GitHub integration
- Communicates with UI via `figma.ui.postMessage`

### UI Thread (React)
- Modern React components with TypeScript
- Custom hooks for plugin state management
- Message-based communication with main thread
- Figma design system styles
- Development mode support

### Communication Pattern
- Main → UI: `figma.ui.postMessage(message)`
- UI → Main: `parent.postMessage({ pluginMessage: message }, '*')`
- Type-safe message interfaces in `src/ui/types/`

## Testing

All existing tests continue to pass:
- Unit tests for processors, services, and utilities
- Snapshot tests for token generation
- Integration tests for variants and transformers

## Next Steps

The plugin is now ready for:
1. Testing in Figma environment
2. UI refinements based on Figma design
3. Additional React component development
4. Performance optimizations

## Technical Benefits

1. **Faster Builds**: Vite provides significantly faster build times than Webpack
2. **Better DX**: Hot module replacement, instant server start, and better error messages
3. **Modern Stack**: React + TypeScript for maintainable UI development
4. **Type Safety**: Full TypeScript coverage for both main and UI threads
5. **Component Reusability**: Modular React components for easier maintenance
6. **Development Server**: Live preview of UI changes during development

## Compatibility

- ✅ Figma plugin requirements maintained
- ✅ All existing functionality preserved
- ✅ GitHub integration unchanged
- ✅ Token processing logic unchanged
- ✅ All tests passing
- ✅ Manifest compatibility maintained

The migration is complete and the plugin is ready for production use.
