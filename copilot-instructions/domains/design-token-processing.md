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
