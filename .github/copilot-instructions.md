# Copilot Instructions for Eggstractor

## 1. Overview

This file enables AI coding assistants to generate features aligned with the Eggstractor project's architecture and style conventions. All conventions documented here are based on actual, observed patterns from the codebase — not invented practices.

Eggstractor is a Figma plugin that extracts design tokens from Figma designs and transforms them into various output formats (CSS, SCSS, Tailwind). The plugin operates through a sophisticated pipeline that processes Figma nodes, extracts style properties, applies transformations, and outputs formatted code.

**Tech Stack:**
- **Runtime**: Figma Plugin API, TypeScript, Node.js
- **Build Tools**: Webpack, Jest, Tailwind CSS
- **Key Frameworks**: Design token processing pipeline, GitHub API integration
- **Testing**: Jest with custom fixtures and snapshots

## 2. File Category Reference

### Figma Plugin Core
**Purpose**: Main plugin orchestration and Figma API integration  
**Examples**: `src/code.ts`, `manifest.json`  
**Conventions**: 
- Use Figma Plugin API types exclusively
- Handle async messaging with UI thread
- Implement plugin lifecycle management (init, cleanup)
- Store configuration in `figma.root.setPluginData()`

### Figma Plugin UI
**Purpose**: User interface for plugin configuration and interaction  
**Examples**: `src/ui.ts`, `src/ui.html`, `src/ui.css`  
**Conventions**:
- Type-safe DOM element access with explicit casting
- Use `parent.postMessage()` for plugin communication
- Implement form validation with real-time feedback
- Auto-save configuration on input changes
- Handle loading states and progress indication

### Design Token Services
**Purpose**: Core business logic for token extraction and management  
**Examples**: `src/services/token.service.ts`, `src/services/collection.service.ts`  
**Conventions**:
- Use dependency injection pattern with service interfaces
- Implement async service methods with proper error handling
- Follow builder pattern for complex token construction
- Use factory pattern for service instantiation
- Return consistent result objects with `{ data, warnings, errors }`

### Style Processors
**Purpose**: Extract and process design properties from Figma nodes  
**Examples**: `src/processors/background.processor.ts`, `src/processors/font.processor.ts`  
**Conventions**:
- Implement `StyleProcessor` interface with `process()` method
- Always check variable bindings before processing raw values
- Use type guards for safe property access
- Accumulate warnings/errors using Sets to avoid duplicates
- Support both variable tokens and computed values

### Output Transformers
**Purpose**: Convert processed tokens into various output formats  
**Examples**: `src/transformers/css.transformer.ts`, `src/transformers/scss.transformer.ts`  
**Conventions**:
- Return `TransformerResult` with `{ output, warnings, errors }`
- Filter valid tokens before processing
- Use `deduplicateMessages()` for error handling
- Convert px values to rem units where appropriate
- Handle variant combinations through middleware

### Tailwind Transformers
**Purpose**: Generate Tailwind CSS utilities and configuration  
**Examples**: `src/transformers/tailwind/generators.ts`, `src/transformers/tailwind/filters.ts`  
**Conventions**:
- Follow Tailwind naming conventions (kebab-case, utility prefixes)
- Use theme tokens for consistent configuration
- Normalize four-sides values with helper functions
- Generate responsive and state variants
- Filter tokens for Tailwind compatibility

### Type Definitions
**Purpose**: TypeScript interfaces and type definitions  
**Examples**: `src/types/tokens.ts`, `src/types/processor.types.ts`  
**Conventions**:
- Use discriminated unions with type guards
- Extend base interfaces for specialized types
- Define optional vs required properties carefully
- Implement validation functions for runtime type checking
- Use generic constraints for type safety

### Utility Functions
**Purpose**: Reusable, domain-agnostic functionality  
**Examples**: `src/utils/color.utils.ts`, `src/utils/value.utils.ts`  
**Conventions**:
- Implement pure functions (no side effects)
- Use options pattern with default parameters
- Handle edge cases gracefully with fallbacks
- Provide type-safe conversion functions
- Document complex utilities with JSDoc

### GitHub Integration
**Purpose**: Git repository integration and PR creation  
**Examples**: `src/github.ts`  
**Conventions**:
- Scope storage to individual Figma files using unique file IDs
- Use async/await for API operations
- Store sensitive data in `figma.clientStorage`
- Handle branch creation and file operations atomically
- Validate repository access before operations

### Test Files
**Purpose**: Unit tests and integration tests  
**Examples**: `src/tests/demo-data.test.ts`, `src/tests/processors/background-processors.test.ts`  
**Conventions**:
- Use Jest with snapshot testing for complex outputs
- Load test data from fixtures in JSON format
- Test error handling and edge cases
- Use descriptive test names following "should do X when Y" pattern
- Mock Figma API calls appropriately

## 3. Feature Scaffold Guide

### Adding a New Style Processor

**Required Files:**
1. `src/processors/[property].processor.ts` - Main processor implementation
2. `src/tests/processors/[property]-processors.test.ts` - Unit tests
3. `src/tests/fixtures/figma-test-data_[property].json` - Test fixtures
4. Update `src/processors/index.ts` to include in appropriate processor group

**Implementation Pattern:**
```typescript
export const [property]Processors: StyleProcessor[] = [
  {
    property: 'css-property-name',
    bindingKey: 'figma-property-key',
    process: async (variables, node?) => {
      // Check for variable bindings first
      const variable = variables.find(v => v.property === 'bindingKey');
      if (variable) {
        return { value: variable.value, rawValue: variable.rawValue };
      }
      
      // Process node properties with type guards
      if (hasProperty(node)) {
        return processProperty(node.property);
      }
      
      return null;
    }
  }
];
```

### Adding a New Output Transformer

**Required Files:**
1. `src/transformers/[format].transformer.ts` - Transformer implementation
2. `src/transformers/tailwind/[format].ts` (if Tailwind-related) - Tailwind-specific logic
3. Update `src/transformers/index.ts` to export new transformer
4. Add format option to UI in `src/ui.html` select element

**Implementation Pattern:**
```typescript
export function transformTo[Format](tokens: TokenCollection): TransformerResult {
  const { warnings, errors } = deduplicateMessages(tokens.tokens);
  
  const validTokens = tokens.tokens.filter(token => 
    token.type === 'style' && token.value != null
  );
  
  const output = generateFormatSpecificOutput(validTokens);
  
  return { output, warnings, errors };
}
```

### Adding a New Utility Function

**Required Files:**
1. `src/utils/[domain].utils.ts` - Utility functions
2. `src/tests/[domain].utils.test.ts` - Unit tests
3. Update `src/utils/index.ts` to export new utilities

**Implementation Pattern:**
```typescript
export function utilityFunction(
  input: InputType,
  options: UtilityOptions = {}
): OutputType {
  const { defaultOption = 'default' } = options;
  
  try {
    return processInput(input, defaultOption);
  } catch (error) {
    console.warn('Utility operation failed:', error);
    return fallbackValue;
  }
}
```

### Adding a New Service

**Required Files:**
1. `src/services/[domain].service.ts` - Service implementation
2. `src/tests/services/[domain].service.test.ts` - Unit tests
3. Update `src/services/index.ts` to export service

**Implementation Pattern:**
```typescript
export class [Domain]Service {
  async processData(input: InputType): Promise<ServiceResult<OutputType>> {
    try {
      const result = await this.performOperation(input);
      return {
        data: result,
        warnings: [],
        errors: []
      };
    } catch (error) {
      return {
        data: null,
        warnings: [],
        errors: [error.message]
      };
    }
  }
}
```

## 4. Integration Rules

### Design Token Processing Pipeline
- All token extraction must go through the processor pipeline (`getProcessorsForNode()`)
- Variable bindings take precedence over computed values
- Processors must handle both TEXT and LAYOUT node types appropriately
- Error accumulation must use Set-based deduplication

### Figma API Integration
- All Figma API calls must be wrapped in try-catch blocks
- Plugin data storage must use unique file IDs for scoping
- UI communication must use structured message types
- Node type checking must use proper type guards

### Output Format Support
- All transformers must return `TransformerResult` interface
- CSS values must support rem conversion for pixel values
- Tailwind outputs must follow official naming conventions
- SCSS outputs must include proper variable declarations

### GitHub Integration Constraints
- Token storage must be scoped per Figma file
- Repository operations must validate access before execution
- Branch creation must handle existing branch scenarios
- File updates must include proper commit messages

### Testing Requirements
- All processors must have corresponding test files with fixtures
- Test data must be stored in `src/tests/fixtures/` as JSON
- Snapshot testing is required for complex output transformations
- Error scenarios must be explicitly tested

### Type Safety Requirements
- All DOM access must use explicit type casting
- Figma node property access must use type guards
- Service method parameters must be properly typed
- Utility functions must handle null/undefined inputs gracefully

## 5. Example Prompt Usage

### Example 1: New Style Processor
**User Request:** "Create a box-shadow processor that handles Figma drop shadow effects"

**Expected AI Response:**
```
I'll create a box-shadow processor following the established patterns:

Files to create:
- `src/processors/shadow.processor.ts` - Main processor implementation
- `src/tests/processors/shadow-processors.test.ts` - Unit tests  
- `src/tests/fixtures/figma-test-data_shadow.json` - Test fixtures

The processor will:
1. Check for variable bindings first
2. Process Figma effects array for drop shadows
3. Convert to CSS box-shadow format
4. Handle multiple shadows and transparency
5. Follow error accumulation patterns
```

### Example 2: New Output Format
**User Request:** "Add support for exporting tokens as JSON format"

**Expected AI Response:**
```
I'll add JSON transformer support following the transformer patterns:

Files to create/modify:
- `src/transformers/json.transformer.ts` - New JSON transformer
- Update `src/transformers/index.ts` to export `transformToJson`
- Update `src/ui.html` to add JSON option to format select
- Add JSON handling to `src/ui.ts` message processing

The transformer will:
1. Implement TransformerResult interface
2. Filter valid tokens using established patterns
3. Structure JSON with metadata and token arrays
4. Include warnings/errors in output
```

### Example 3: New Utility Function
**User Request:** "Create a utility to convert Figma blend modes to CSS mix-blend-mode values"

**Expected AI Response:**
```
I'll create a blend mode utility following utility conventions:

Files to create:
- `src/utils/blend.utils.ts` - Blend mode conversion utilities
- `src/tests/blend.utils.test.ts` - Unit tests
- Update `src/utils/index.ts` to export blend utilities

The utility will:
1. Implement pure conversion functions
2. Handle unsupported blend modes gracefully
3. Provide fallback values for edge cases
4. Use proper TypeScript typing
5. Include comprehensive test coverage
```

### Example 4: GitHub Integration Enhancement
**User Request:** "Add support for creating GitHub issues when token generation has warnings"

**Expected AI Response:**
```
I'll enhance GitHub integration following established patterns:

Files to modify:
- `src/github.ts` - Add issue creation methods
- `src/ui.ts` - Add UI controls for issue options
- `src/ui.html` - Add checkbox for "Create issue on warnings"

The enhancement will:
1. Use existing GitHub API authentication
2. Follow file-scoped storage patterns
3. Include proper error handling
4. Validate repository permissions
5. Format warnings as structured issue content
```

---

This instruction file provides comprehensive guidance for maintaining consistency with Eggstractor's established patterns and conventions. All recommendations are based on actual codebase analysis and observed practices.
