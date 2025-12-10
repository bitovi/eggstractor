# Design Token Processing Domain

## Overview

The design token processing domain handles the extraction, organization, and normalization of design tokens from Figma nodes. This system transforms Figma's design data into structured tokens that can be consumed by code generation transformers.

## Token Collection Architecture

### Entry Point and Orchestration

The primary entry point is `collectTokens` in `packages/figma/src/services/collection.service.ts`:

```typescript
export async function collectTokens(
  onProgress?: (progress: number, message: string) => void,
): Promise<TokenCollection> {
  const result: TokenCollection = {
    tokens: [],
    components: {},
    warnings: [],
    errors: [],
  };

  // Collect variables and effects first
  const variables = await collectAllFigmaVariables();
  const effects = await collectAllFigmaEffectStyles();

  result.tokens.push(...variables.tokens);
  result.tokens.push(...effects.tokens);

  // Then process scene nodes
  const pages = figma.root.children;
  // Process each page...
}
```

### Token Types and Hierarchy

The system processes four distinct token types:

1. **Variable Tokens**: Figma variables (primitives and semantic)
2. **Effect Tokens**: Figma effect styles (shadows, blurs)
3. **Style Tokens**: Extracted from individual nodes
4. **Component Tokens**: Component and component set metadata

```typescript
export interface TokenCollection {
  tokens: Token[];
  components: Record<string, ComponentToken>;
  warnings: string[];
  errors: string[];
}

type Token =
  | StyleToken
  | VariableToken
  | EffectToken
  | ComponentToken
  | ComponentSetToken
  | InstanceToken;
```

## Processor Pattern Implementation

### Node Type Routing

Processors are assigned based on Figma node types:

```typescript
export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case 'TEXT':
      return TEXT_PROCESSORS;
    case 'FRAME':
    case 'RECTANGLE':
    case 'INSTANCE':
    case 'ELLIPSE':
    case 'COMPONENT':
    case 'VECTOR':
    case 'STAR':
    case 'POLYGON':
      return LAYOUT_PROCESSORS;
    default:
      return [];
  }
}
```

### Processor Categories

**Text Processors**: `fontProcessors`

- Font family, size, weight extraction
- Text alignment and spacing
- Line height and letter spacing

**Layout Processors**: Combined array of:

- `backgroundProcessors`: Background colors and fills
- `layoutProcessors`: Flexbox properties and dimensions
- `borderProcessors`: Border styles, radius, and widths
- `spacingProcessors`: Padding and margin values

### Processor Interface

All processors implement the `StyleProcessor` interface:

```typescript
export interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings | undefined;
  process: (
    variableTokenMapByProperty: Map<string, VariableToken>,
    node: SceneNode,
  ) => Promise<ProcessedValue | null>;
}
```

### Example Background Processor

```typescript
export const backgroundProcessors: StyleProcessor[] = [
  {
    property: 'background',
    bindingKey: 'fills',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node: SceneNode,
    ): Promise<ProcessedValue | null> => {
      if ('fills' in node && Array.isArray(node.fills)) {
        const visibleFills = node.fills.filter((fill) => fill.visible);
        if (!visibleFills.length) return null;

        const backgrounds = await Promise.all(
          visibleFills.map(async (fill: Paint) => {
            if (fill.type === 'SOLID') {
              const fillVariable = variableTokenMapByProperty.get('fills');
              if (fillVariable) {
                return {
                  value: fillVariable.value,
                  rawValue: fillVariable.rawValue,
                };
              }

              const { r, g, b } = fill.color;
              const a = fill.opacity ?? 1;
              const value = rgbaToString(r, g, b, a);
              return { value, rawValue: value };
            }
            return null;
          }),
        );

        const validBackgrounds = backgrounds.filter((b): b is NonNullable<typeof b> => b !== null);
        if (validBackgrounds.length > 0) {
          return {
            value: validBackgrounds.map((b) => b.value).join(', '),
            rawValue: validBackgrounds.map((b) => b.rawValue).join(', '),
          };
        }
      }
      return null;
    },
  },
];
```

## Variable Token Integration

### Variable Collection

The system collects Figma variables separately and integrates them into processors:

```typescript
export async function collectAllFigmaVariables(): Promise<{
  tokens: VariableToken[];
  variables: Variable[];
  collections: VariableCollection[];
}> {
  const collections = await figma.variables.getLocalVariableCollections();
  const allTokens: VariableToken[] = [];

  for (const collection of collections) {
    const variables = await Promise.all(
      collection.variableIds.map((id) => figma.variables.getVariableById(id)),
    );

    for (const variable of variables) {
      if (variable) {
        const token = await extractVariableToken(variable, collection);
        if (token) {
          allTokens.push(token);
        }
      }
    }
  }

  return { tokens: allTokens, variables: allVariables, collections };
}
```

### Variable Binding Detection

Processors can detect when nodes use variables instead of literal values:

```typescript
const fillVariable = variableTokenMapByProperty.get('fills');
if (fillVariable) {
  return {
    value: fillVariable.value,
    rawValue: fillVariable.rawValue,
  };
}
```

## Component Processing

### Component Hierarchy Detection

The system processes components at multiple levels:

1. **Component Sets**: Collections of variants
2. **Components**: Individual component definitions
3. **Instances**: Component instantiations

```typescript
async function processComponentSetNode(componentSetNode: ComponentSetNode): Promise<void> {
  const { duplicateNames, hasDuplicates } = detectComponentSetDuplicates(componentSetNode);

  if (hasDuplicates) {
    result.warnings.push(
      `Component set "${componentSetNode.name}" has duplicate variant names: ${duplicateNames.join(', ')}`,
    );
    result.tokens.push(createWarningToken(componentSetNode, duplicateNames));
    return;
  }

  const componentSetToken = await extractComponentSetToken(componentSetNode);
  if (componentSetToken) {
    result.tokens.push(componentSetToken);
  }
}
```

### Instance Deduplication

To avoid duplicate tokens, instances that reference already-processed components are skipped:

```typescript
function shouldSkipInstanceToken(
  instanceToken: InstanceToken,
  collection: TokenCollection,
): boolean {
  if (instanceToken.componentNode) {
    const baseComponentId = instanceToken.componentNode.id;
    const baseComponent = collection.components[baseComponentId];

    if (baseComponent) {
      console.info(
        `🎯 Instance "${node.name}" duplicates component "${baseComponentId}" - skipping tokens`,
      );
      return true;
    }
  }
  return false;
}
```

## Token Extraction Pipeline

### Node Processing Flow

For each scene node, the system:

1. **Determines processors** based on node type
2. **Collects variable bindings** for the node
3. **Runs each processor** against the node
4. **Aggregates results** into style tokens

```typescript
const extractedTokens = await extractNodeToken(childNode, pathFromRoot, parentSceneNodes);

if (extractedTokens.issues.length > 0) {
  extractedTokens.issues.forEach((issue) => {
    result.tokens.push(createErrorToken(issue));
  });
}

result.tokens.push(...extractedTokens.tokens);
```

### Progress Tracking

Processing includes progress reporting for UI feedback:

```typescript
const processPage = async (page: PageNode, pageIndex: number) => {
  await onProgress?.(
    (pageIndex / totalPages) * MAX_PROGRESS_PERCENTAGE * 0.8,
    `Loading pages... ${pageIndex + 1}/${totalPages}`,
  );

  const sceneNodes = getParentSceneNodes(page);
  for (const [nodeIndex, node] of sceneNodes.entries()) {
    await onProgress?.(
      progressBase + (nodeIndex / sceneNodes.length) * progressPerPage,
      `Processing nodes… ${nodeIndex + 1}/${sceneNodes.length}`,
    );
  }
};
```

## Error Handling and Validation

### Duplicate Detection

The system detects and warns about various duplicate patterns:

```typescript
export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const duplicateNames: string[] = [];
  const seenVariants = new Set<string>();

  if (!('children' in componentSetNode)) {
    return { duplicateNames, hasDuplicates: false };
  }

  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      const variantName = child.name || 'unnamed';

      if (seenVariants.has(variantName)) {
        duplicateNames.push(variantName);
      } else {
        seenVariants.add(variantName);
      }
    }
  }

  return { duplicateNames, hasDuplicates: duplicateNames.length > 0 };
}
```

### Issue Tracking

Processors can report warnings and errors that are surfaced to users:

```typescript
const result: ProcessedValue = {
  warnings: warningsSet.size > 0 ? Array.from(warningsSet) : undefined,
  errors: errorsSet.size > 0 ? Array.from(errorsSet) : undefined,
  value: null,
  rawValue: null,
};
```

This architecture ensures comprehensive token extraction while maintaining performance and providing detailed feedback about the processing pipeline.

## Multi-Mode (Theme) Support

### Mode Support Overview

The system supports Figma's variable modes, which allow designers to define multiple values for the same variable (e.g., light mode, dark mode, high contrast). This enables theme switching in the generated CSS output.

### Mode Data Structure

#### TokenCollection Modes Map

Mode information is stored centrally in the `TokenCollection`:

```typescript
export interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
  components: Record<ComponentToken['id'], ComponentToken>;
  componentSets: Record<ComponentSetToken['id'], ComponentSetToken>;
  instances: Record<InstanceToken['id'], InstanceToken>;
  /** Map of modeId -> modeName for all modes found in variable collections */
  modes?: Map<string, string>;
}
```

The `modes` map is populated during variable collection and provides the canonical source of mode names.

#### VariableToken Mode Fields

Each `VariableToken` can store mode-specific values:

```typescript
export interface VariableToken extends BaseToken {
  type: 'variable';
  property: string;
  rawValue: string; // Value for the default mode
  primitiveRef?: string; // Reference to primitive variable (for semantic tokens)
  valueType: 'px' | null;
  modeValues?: Record<string, string>; // Map of modeId -> value for all modes
  metadata?: {
    // ... other fields
    modeId?: string; // ID of the default mode
    modeName?: string; // Name of the default mode
  };
}
```

**Key Points:**

- `rawValue` always contains the default (first) mode's value
- `modeValues` is only present when a variable has multiple modes (>1)
- Keys in `modeValues` are Figma's internal mode IDs (e.g., "2002:0", "2002:1")
- The `metadata.modeId` and `metadata.modeName` refer to the default mode only

### Mode Collection Process

#### Step 1: Collecting Mode Information

During primitive variable collection in `collectPrimitiveVariables`:

```typescript
// Initialize modes map if not already present
if (!collection.modes) {
  collection.modes = new Map<string, string>();
}

// For each variable collection
for (const varCollection of variableCollections) {
  // Collect mode information from this collection
  const modes = getModesFromCollection(varCollection);
  for (const mode of modes) {
    collection.modes.set(mode.modeId, mode.modeName);
  }

  // Process variables...
}
```

The `getModesFromCollection` utility extracts mode information from Figma's `VariableCollection`:

```typescript
export function getModesFromCollection(collection: VariableCollection): ModeInfo[] {
  return collection.modes.map((mode) => ({
    modeId: mode.modeId,
    modeName: mode.name,
  }));
}
```

#### Step 2: Processing Multi-Mode Variables

In `createPrimitiveVariableToken`, values are collected for all modes:

```typescript
const modes = getModesFromCollection(collection);
const defaultMode = modes[0];
const modeValues: Record<string, string> = {};

// Process all modes and collect their values
for (const mode of modes) {
  const value = variable.valuesByMode[mode.modeId];
  if (!value) continue;

  let modeRawValue: string;
  // Extract value based on variable type (COLOR, FLOAT, STRING)
  // ...

  modeValues[mode.modeId] = modeRawValue.toLowerCase();
}

return {
  // ... other fields
  rawValue: defaultModeRawValue, // Default mode value
  modeValues: Object.keys(modeValues).length > 1 ? modeValues : undefined,
  metadata: {
    modeId: defaultMode.modeId,
    modeName: defaultMode.modeName,
  },
};
```

**Important:** `modeValues` is only set when there are multiple modes (>1), optimizing for the common single-mode case.

### CSS Generation for Modes

#### Output Structure

The `generateThemeDirective` function produces mode-aware CSS:

```css
/* Primitive tokens - default mode values */
:root {
  --color-blue-500: #0080ff;
  --color-gray-100: #f5f5f5;
  --spacing-base: 16px;
}

/* Semantic tokens for default mode (light) */
:root,
[data-theme='light'] {
  --action-bg: var(--color-blue-500);
  --surface-bg: var(--color-gray-100);
}

/* Dark mode overrides */
[data-theme='dark'] {
  --color-blue-500: #0066cc;
  --color-gray-100: #1a1a1a;
  --action-bg: var(--color-blue-500);
  --surface-bg: var(--color-gray-100);
}
```

#### Generation Logic

1. **`:root` block**: Contains primitive tokens with default mode values
2. **`:root, [data-theme='default-mode']` block**: Contains semantic tokens for the default mode
3. **`[data-theme='mode-name']` blocks**: Override blocks for each non-default mode

```typescript
// Extract mode information from the collection
const modesMap = collection.modes || extractModesFromTokens(variableTokens);
const modes = Array.from(modesMap.entries());

if (modes.length > 1) {
  const defaultModeId = modes[0][0];
  const defaultModeName = modes[0][1];

  // Output default mode semantic tokens
  result += `/* ${defaultModeName} mode semantic tokens (default) */\n`;
  result += `:root,\n[data-theme='${defaultModeName}'] {\n`;
  // ... output tokens
  result += '}\n\n';

  // Output alternate mode overrides
  for (let i = 1; i < modes.length; i++) {
    const [modeId, modeName] = modes[i];

    result += `/* ${modeName} mode overrides */\n`;
    result += `[data-theme='${modeName}'] {\n`;
    // ... output tokens with mode-specific values
    result += '}\n\n';
  }
}
```

### Mode Name Normalization

Mode names from Figma are sanitized for use in CSS selectors:

```typescript
export function normalizeModeName(modeName: string): string {
  return sanitizeName(modeName.toLowerCase().replace(/\s+/g, '-'));
}
```

**Examples:**

- "Light Mode" → "light-mode"
- "High Contrast" → "high-contrast"
- "Foundation" → "foundation"

**Important:** The system respects whatever mode names designers use in Figma. There's no forced mapping to "light"/"dark".

### Using Themes in Applications

#### HTML Data Attribute

Apply themes by setting the `data-theme` attribute on any element:

```html
<html data-theme="dark">
  <!-- Dark mode applied -->
</html>

<div data-theme="high-contrast">
  <!-- High contrast mode scoped to this div -->
</div>
```

#### JavaScript Theme Switching

```typescript
// Switch global theme
document.documentElement.setAttribute('data-theme', 'dark');

// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
```

### Fallback Mode Extraction

If `collection.modes` is not available, the system falls back to extracting mode information from token metadata:

```typescript
function extractModesFromTokens(tokens: VariableToken[]): Map<string, string> {
  const modesMap = new Map<string, string>();

  for (const token of tokens) {
    if (token.modeValues) {
      for (const modeId of Object.keys(token.modeValues)) {
        if (!modesMap.has(modeId)) {
          // Try to match with token's metadata
          if (token.metadata?.modeId === modeId && token.metadata?.modeName) {
            modesMap.set(modeId, normalizeModeName(token.metadata.modeName));
          } else {
            // Fallback: use modeId as the name
            modesMap.set(modeId, `mode-${modeId}`);
          }
        }
      }
    }
  }

  return modesMap;
}
```

This ensures backward compatibility and graceful degradation.

### Testing Multi-Mode Support

Test fixtures should include tokens with `modeValues`:

```typescript
const multiModeToken: VariableToken = {
  type: 'variable',
  name: 'color-primary',
  property: 'color',
  value: '$color-primary',
  rawValue: '#0080ff', // default mode
  valueType: null,
  path: [],
  modeValues: {
    'mode-1': '#0080ff', // light
    'mode-2': '#0066cc', // dark
  },
  metadata: {
    variableId: 'var-1',
    variableName: 'Color/Primary',
    variableTokenType: 'primitive',
    modeId: 'mode-1',
    modeName: 'light',
  },
};

const collection: TokenCollection = {
  tokens: [multiModeToken],
  components: {},
  componentSets: {},
  instances: {},
  modes: new Map([
    ['mode-1', 'light'],
    ['mode-2', 'dark'],
  ]),
};
```

### Best Practices

1. **Always populate `collection.modes`**: Ensures accurate mode names in CSS output
2. **Use semantic mode names**: Match designer intentions (e.g., "light", "dark", "high-contrast")
3. **Test with multiple modes**: Verify CSS output for 2+ mode scenarios
4. **Handle single-mode gracefully**: Tokens without `modeValues` should work seamlessly
5. **Preserve mode order**: The first mode is always the default
