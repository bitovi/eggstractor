# Eggstractor Development Instructions

## Overview

This file enables AI coding assistants to generate features aligned with the Eggstractor project's architecture and style conventions. All patterns described here are based on actual, observed implementations in the codebase - not invented practices.

**Project Summary**: Eggstractor is a Figma plugin that extracts design tokens from Figma designs and generates production-ready CSS, SCSS, and Tailwind stylesheets with automated GitHub integration.

## File Category Reference

### react-components

**Purpose**: UI components for the Figma plugin interface  
**Examples**: `./packages/ui/src/app/components/Button/Button.tsx`, `./packages/ui/src/app/routes/Form/Form.tsx`  
**Key Conventions**:

- Use TypeScript generics with string/number constraints: `<T extends string = string>`
- onChange handlers pass entire objects, not just values: `onChange: (option: SelectOption<T>) => void`
- All form components require explicit `id` props for accessibility
- Conditional features based on `__DEV__` flag for development-only functionality
- Direct context hook integration without prop drilling: `const { repoPath, setRepoPath } = useConfig()`

### react-hooks

**Purpose**: Custom hooks for plugin communication and state management  
**Examples**: `./packages/ui/src/app/hooks/useOnPluginMessage/useOnPluginMessage.ts`  
**Key Conventions**:

- Type-safe plugin message handling with discriminated unions
- Context hooks throw errors if used outside providers
- Route persistence through build-time injection: `(window as any).__INITIAL_ROUTE__`

### react-context

**Purpose**: Global state management providers  
**Examples**: `./packages/ui/src/app/context/ConfigContext/ConfigContext.tsx`  
**Key Conventions**:

- Auto-sync context changes to Figma plugin storage via `useEffect`
- Controlled props with 'p' prefix and internal state fallbacks
- Expose both values and setter functions in context type

### figma-processors

**Purpose**: Extract design properties from Figma nodes  
**Examples**: `./packages/figma/src/processors/background.processor.ts`  
**Key Conventions**:

- Node type routing with predefined processor arrays
- Check for Figma variable bindings before extracting literal values
- Export processor arrays, not individual processors: `export const backgroundProcessors: StyleProcessor[]`

### figma-services

**Purpose**: Orchestrate token collection and data management  
**Examples**: `./packages/figma/src/services/collection.service.ts`  
**Key Conventions**:

- Async service functions with progress callbacks
- File-scoped data storage using unique file IDs
- Component deduplication logic to avoid duplicate tokens

### figma-transformers

**Purpose**: Convert tokens to CSS/SCSS/Tailwind output  
**Examples**: `./packages/figma/src/transformers/scss.transformer.ts`  
**Key Conventions**:

- Universal transformer interface: `(tokens: TokenCollection, useCombinatorialParsing: boolean) => TransformerResult`
- Single transformer handles both template and combinatorial parsing modes
- Automatic rem conversion with 16px base for pixel values
- SCSS variables prefixed with 'v' for non-alphabetic starts

### utility-functions

**Purpose**: Shared utilities across packages  
**Examples**: `./packages/ui/src/app/utils/message-main-thread.utils.ts`  
**Key Conventions**:

- Environment detection for plugin vs development mode
- Message abstraction handling both plugin and mock environments
- Consistent error handling and validation patterns

### type-definitions

**Purpose**: TypeScript interfaces and types  
**Examples**: `./packages/common/src/types/message-to-ui-payload.ts`  
**Key Conventions**:

- Discriminated unions with 'type' property for tokens and messages
- Base interfaces extended by specific payload types
- Strict typing for Figma API interactions

## Feature Scaffold Guide

### Adding a New React Component

1. **Create component folder**: `packages/ui/src/app/components/NewComponent/`
2. **Required files**:
   - `NewComponent.tsx` - Main component implementation
   - `index.ts` - Barrel export: `export * from './NewComponent';`
3. **Component structure**:
   - Use generic props with type constraints if needed
   - Integrate with context hooks directly: `const { value, setValue } = useConfig()`
   - Include explicit `id` prop for form elements
   - Use `classnames` library for conditional CSS: `className={cn('base-class', props.className)}`

### Adding a New Figma Processor

1. **Create processor file**: `packages/figma/src/processors/new-property.processor.ts`
2. **Export pattern**: `export const newPropertyProcessors: StyleProcessor[]`
3. **Implementation**:
   - Check variable bindings first: `variableTokenMapByProperty.get('bindingKey')`
   - Return `ProcessedValue | null`
   - Include error/warning arrays in result
4. **Register processor**: Add to appropriate array in `packages/figma/src/processors/index.ts`

### Adding a New Transformer

1. **Create transformer**: `packages/figma/src/transformers/new-format.transformer.ts`
2. **Implement interface**: `export const transformToNewFormat: Transformer`
3. **Handle parsing modes**: Branch on `useCombinatorialParsing` parameter
4. **Register format**: Add case to switch statement in main thread `transformTokensToStylesheet`

### Adding a New Context Provider

1. **Create context folder**: `packages/ui/src/app/context/NewContext/`
2. **Required patterns**:
   - Interface with both values and setters: `NewContextType = NewData & { setField: Dispatch<SetStateAction<Type>> }`
   - Error-throwing hook: `if (!ctx) throw new Error('useNew must be used within NewProvider')`
   - Auto-sync changes via `useEffect` if needed for persistence

## Integration Rules

### Figma Plugin Architecture Constraints

- **Main thread isolation**: Main thread cannot access DOM/React, only Figma API
- **Message type safety**: All communication must use typed `MessageToUIPayload` and `MessageToMainThreadPayload`
- **Data persistence**: Use `figma.clientStorage` for user data, `figma.root.setPluginData` for file data

### Design Token Processing Rules

- **Processor routing**: Use `getProcessorsForNode()` to assign processors based on Figma node types
- **Variable precedence**: Always check Figma variable bindings before extracting literal values
- **Token collection**: All tokens must be aggregated into `TokenCollection` structure

### Code Generation Requirements

- **Transformer interface**: All transformers must implement `(TokenCollection, boolean) => TransformerResult`
- **Naming consistency**: Use `createNamingContext()` for consistent token naming across formats
- **Unit handling**: Pixel values must be converted to rem using `rem()` utility

### UI State Management Rules

- **Context access**: All context must be accessed via custom hooks that enforce provider presence
- **Message handling**: Use `useOnPluginMessage` for type-safe Figma plugin communication
- **Auto-persistence**: Configuration changes must auto-sync to plugin storage

### GitHub Integration Constraints

- **File scoping**: All GitHub data must be scoped per-file using `getFileId()`
- **REST API only**: Only GitHub REST API supported, no GraphQL
- **PR workflow**: Must follow create branch → commit file → create PR sequence

### Component Structure Rules

- **Folder organization**: Each component gets own folder with Component.tsx and index.ts
- **Barrel exports**: Use index.ts files for clean re-exports throughout component tree
- **Context integration**: Form components must connect directly to context hooks, not props

### Testing Requirements

- **Processor tests**: Use `createTestData()` with JSON fixtures matching Figma API responses
- **Snapshot testing**: All transformer outputs must use snapshot tests for regression prevention
- **Mock isolation**: Tests must properly isolate Figma API mocks per test case

## Example Prompt Usage

**User Request**: "Create a number input component for font size with validation"

**Expected AI Response**:

```text
I'll create a number input component following the Eggstractor conventions:

packages/ui/src/app/components/NumberInput/
├── NumberInput.tsx
└── index.ts

packages/ui/src/app/routes/Form/components/FontSizeInput/
├── FontSizeInput.tsx
└── index.ts

The NumberInput will use TypeScript generics, include required id prop, and integrate with validation. The FontSizeInput will connect to useConfig() context and include min/max validation for font sizes.
```

**User Request**: "Add support for extracting font-style property from text nodes"

**Expected AI Response**:

```text
I'll add font-style processing following the processor patterns:

packages/figma/src/processors/font-style.processor.ts
- Export fontStyleProcessors array
- Check variable bindings first
- Extract from TEXT nodes only
- Return italic/normal values

Update packages/figma/src/processors/font.processor.ts to include new processor
Update packages/figma/src/processors/index.ts to register in TEXT_PROCESSORS
Add test file with Figma fixture data
```

This instruction file ensures all generated code follows established patterns and integrates seamlessly with the existing Eggstractor architecture.
