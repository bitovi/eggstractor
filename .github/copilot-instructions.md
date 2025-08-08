# Eggstractor - Figma Plugin Copilot Instructions

## Overview

This file enables AI coding assistants to generate features aligned with the Eggstractor project's architecture and style. It is based only on actual, observed patterns from the codebase — not invented practices.

**Project Purpose**: Eggstractor is a Figma plugin that extracts design tokens from Figma designs and transforms them into CSS/SCSS variables and Tailwind utilities, with automated GitHub integration for design system workflows.

## File Category Reference

### Figma Plugin Core

**Purpose**: Main plugin architecture with dual-context execution (main thread + UI thread)
**Examples**: `src/code.ts`, `src/ui/` (React components), `manifest.json`
**Key Conventions**:

- Use message passing for main/UI communication
- All Figma API calls must be async
- Store plugin data with file-specific IDs
- Handle errors by sending messages to UI
- Main thread: `src/code.ts` handles Figma API operations
- UI thread: React app in `src/ui/` with TypeScript components
- Build system: Vite with React for modern development experience

### Processors

**Purpose**: Extract style properties from Figma nodes into structured tokens
**Examples**: `src/processors/background.processor.ts`, `src/processors/font.processor.ts`
**Key Conventions**:

- Implement StyleProcessor interface with property, bindingKey, and process function
- Check for variable bindings first, then fall back to direct node properties
- Use type guards for node property validation
- Return null when processor cannot handle the node
- Accumulate warnings/errors using Set data structures

### Services

**Purpose**: Orchestrate token collection and manage extraction workflow
**Examples**: `src/services/collection.service.ts`, `src/services/token.service.ts`
**Key Conventions**:

- Use descriptive function names with action verbs (extract*, collect*, detect*, get*)
- Implement recursive node traversal with early returns for filtering
- Create warning tokens for problematic component structures
- Always await component resolution for instance nodes
- Use Set data structures for duplicate detection

### Transformers

**Purpose**: Convert design tokens into various output formats (SCSS, CSS, Tailwind)
**Examples**: `src/transformers/scss.transformer.ts`, `src/transformers/css.transformer.ts`
**Key Conventions**:

- Return TransformerResult interface with result, warnings, errors
- Always deduplicate warnings/errors from tokens
- Sanitize all output names for target format compatibility
- Convert pixel values to rem units for SCSS
- Separate variables from mixins in SCSS generation
- Parenthesize negated SCSS variables

### Tailwind Transformers

**Purpose**: Generate Tailwind-specific utility classes and configurations
**Examples**: `src/transformers/tailwind/generators.ts`, `src/transformers/tailwind/filters.ts`
**Key Conventions**:

- Integrate with theme tokens system from theme-tokens.ts
- Use normalizeFourSides function for consistent spacing
- Define property shorthand mappings for Tailwind classes
- Use Set data structures for value validation
- Create explicit CSS value to class mappings
- Support both Tailwind v3 and v4 output formats

### Utility Functions

**Purpose**: Pure, stateless functions organized by domain
**Examples**: `src/utils/color.utils.ts`, `src/utils/gradient.utils.ts`
**Key Conventions**:

- Organize into domain-specific modules (color, gradient, units, etc.)
- All functions must be pure with no side effects
- Use Math.round() for color value precision
- Format hex colors as uppercase with proper padding
- Handle null/undefined inputs gracefully
- Use Set data structures for deduplication

### Types

**Purpose**: TypeScript type definitions and interfaces
**Examples**: `src/types/processors.ts`, `src/types/tokens.ts`
**Key Conventions**:

- Export all interfaces for external consumption
- Use discriminated unions with type property
- Support both single values and arrays for flexibility
- Extend base interfaces for common properties
- Use .d.ts files for external library augmentation
- Define consistent result interfaces for processing functions

### GitHub Integration

**Purpose**: Automated repository operations and PR creation
**Examples**: `src/github.ts`
**Key Conventions**:

- Use file-specific token storage for multi-repository support
- Store configuration in plugin data with JSON serialization
- Use consistent REST API headers with Bearer token
- Provide specific error context for different failures
- Base64 encode all file content for GitHub API
- Follow exact Git workflow sequence (branch → commit → PR)

### Unit Tests

**Purpose**: Quality assurance through snapshot and integration testing
**Examples**: `src/tests/demo-data.test.ts`, `src/tests/processors/background-processors.test.ts`
**Key Conventions**:

- Use Jest snapshots for output validation
- Organize tests by domain with descriptive names
- Use real Figma data fixtures for realistic testing
- Handle async operations properly
- Avoid mocks and use serialized data for accuracy

## Feature Scaffold Guide

### Creating a New Processor

1. **File Location**: `src/processors/[domain].processor.ts`
2. **Required Elements**:
   - Implement StyleProcessor interface
   - Export processor array (e.g., `export const backgroundProcessors: StyleProcessor[]`)
   - Add to appropriate processor category in `src/processors/index.ts`
3. **Test Files**: `src/tests/processors/[domain]-processors.test.ts`
4. **Fixtures**: Add test data to `src/tests/fixtures/` if needed

### Creating a New Transformer

1. **File Location**: `src/transformers/[format].transformer.ts`
2. **Required Elements**:
   - Function accepting TokenCollection, returning TransformerResult
   - Export from `src/transformers/index.ts`
   - Handle error deduplication and name sanitization
3. **Integration**: Add format option to UI select and main thread switch statement

### Creating a New Utility

1. **File Location**: `src/utils/[domain].utils.ts`
2. **Required Elements**:
   - Pure functions with explicit return types
   - Export from `src/utils/index.ts`
   - Handle null/undefined inputs
   - Include TypeScript documentation

### Adding New UI Features

1. **React Components**: Add to `src/ui/components/` with TypeScript
2. **Styling**: Use existing CSS classes in `src/ui/styles.css` or add new ones
3. **State Management**: Use React hooks and custom hooks in `src/ui/hooks/`
4. **Type Definitions**: Add types to `src/ui/types/`
5. **Main Thread Communication**: Handle messages in `src/code.ts` message handler
6. **Build Compatibility**: Target ES2017 for Figma compatibility (no nullish coalescing)
7. **React Transform**: Use classic JSX transform (`jsx: "react"`) for Figma compatibility

## Integration Rules

### Style Processing Constraints

- All canvas logic must use StyleProcessor interface pattern
- Processors must handle variable bindings before direct properties
- Node traversal must filter out VECTOR nodes and hidden nodes (names starting with . or \_)

### Code Generation Requirements

- All generated names must use sanitizeName utility
- SCSS output must convert px values to rem using rem() utility
- Gradient processing must use processGradient utility for CSS generation

### Figma Plugin API Rules

- Main thread has Figma API access, UI thread has DOM access
- All communication uses figma.ui.postMessage/parent.postMessage
- Plugin operations limited to current page only
- Network requests restricted to https://api.github.com
- Target ES2017 for JavaScript compatibility (avoid nullish coalescing ?? and ??=)
- Use classic React JSX transform for UI compatibility

### Testing Requirements

- New processors must include snapshot tests with fixture data
- Tests must be organized by domain in appropriate subdirectories
- Avoid real API calls in tests - use serialized data
- Update snapshots using npm run test:snapshot when structure changes

## Example Prompt Usage

**Request**: "Create a new processor that extracts text decoration styles from text nodes"

**AI Response**: Creates these files:

- `src/processors/text-decoration.processor.ts` - Implements StyleProcessor interface
- `src/tests/processors/text-decoration-processors.test.ts` - Snapshot tests
- `src/tests/fixtures/figma-test-data_text-decoration.json` - Test fixture data
- Updates `src/processors/index.ts` to include new processor in TEXT_PROCESSORS array

**Request**: "Add support for exporting design tokens as JSON format"

**AI Response**: Creates:

- `src/transformers/json.transformer.ts` - Implements TransformerResult interface
- Updates `src/transformers/index.ts` exports
- Adds "json" option to UI format select in React component
- Updates format handling in `src/code.ts` and React UI components

**Request**: "Create a utility for converting Figma blend modes to CSS mix-blend-mode values"

**AI Response**: Creates:

- `src/utils/blend-mode.utils.ts` - Pure functions for blend mode conversion
- Updates `src/utils/index.ts` exports
- Includes proper TypeScript types and null handling
- Adds unit tests in appropriate test file
