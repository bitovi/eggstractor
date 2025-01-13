import Utils from './utils';
import Github from './github';

// Show the UI with resizable window
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: "Eggstractor"
});

interface VariableBindings {
  fills?: VariableAlias | VariableAlias[];
  strokes?: VariableAlias | VariableAlias[];
  strokeWeight?: VariableAlias | VariableAlias[];
  fontSize?: VariableAlias | VariableAlias[];
  fontWeight?: VariableAlias | VariableAlias[];
  lineHeight?: VariableAlias | VariableAlias[];
  letterSpacing?: VariableAlias | VariableAlias[];
  fontFamily?: VariableAlias | VariableAlias[];
  cornerRadius?: VariableAlias | VariableAlias[];
  itemSpacing?: VariableAlias | VariableAlias[];
}

interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings;
  process: (value: Variable | null, node?: SceneNode) => Promise<string>;
}

// Token Types
interface DesignToken {
  type: 'color' | 'dimension' | 'number' | 'string';
  name: string;
  value: any;
  originalValue?: any;
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
  };
}

interface StyleToken extends DesignToken {
  property: string;
  path: string[];
  rawValue: string;
}

interface TokenCollection {
  tokens: StyleToken[];
}

// Main generation function
async function generateStyles(format: 'scss' | 'less' | 'postcss'): Promise<string> {
  const tokens = await collectTokens();
  switch (format) {
    case 'scss':
      return transformToScss(tokens);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Token Collection
async function collectTokens(): Promise<TokenCollection> {
  const collection: TokenCollection = { tokens: [] };

  async function processNode(node: BaseNode) {
    if ('type' in node && 'boundVariables' in node) {
      if (node.type !== "COMPONENT") {
        const processors = getProcessorsForNode(node as SceneNode);
        const nodePath = getNodePathName(node as SceneNode).split('_');

        for (const processor of processors) {
          const token = await extractNodeToken(node as SceneNode, processor, nodePath);
          if (token) {
            collection.tokens.push(token);
          }
        }
      }
    }

    // Always process children, even for component sets
    if ("children" in node) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  }

  await processNode(figma.currentPage);
  return collection;
}

// Token Extraction
async function extractNodeToken(
  node: SceneNode,
  processor: StyleProcessor,
  path: string[]
): Promise<StyleToken | null> {
  // Handle static layout properties
  if (['display', 'flex-direction', 'align-items'].includes(processor.property)) {
    return {
      type: 'string',
      name: path.join('_'),
      value: processor.process ? await processor.process(null, node) : '',
      rawValue: processor.process ? await processor.process(null, node) : '',
      property: processor.property,
      path
    };
  }

  // Cast from the default Figma type to your custom interface
  const customBoundVariables = node.boundVariables as unknown as VariableBindings;

  // Now TypeScript knows cornerRadius (and others) can exist
  const binding = customBoundVariables[processor.bindingKey];

  // If it’s an array, pick the first variable ID
  const variableId = Array.isArray(binding) ? binding[0]?.id : binding?.id;

  if (variableId) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (variable) {
      const rawValue = await getVariableFallback(variable);
      const name = variable.name;

      return {
        type: variable.resolvedType.toLowerCase() as 'color' | 'dimension' | 'number' | 'string',
        name,
        value: `$${Utils.sanitizeName(variable.name)}`,
        rawValue,
        property: processor.property,
        path,
        metadata: {
          figmaId: node.id,
          variableId: variable.id,
          variableName: variable.name
        }
      };
    }
  }

  // Handle direct values
  const directValue = getDirectNodeValue(node, processor.property);
  if (directValue) {
    return {
      type: 'dimension',
      name: path.join('_'),
      value: directValue,
      rawValue: directValue,
      property: processor.property,
      path,
    };
  }

  return null;
}

// SCSS Transform
function transformToScss(tokens: TokenCollection): string {
  // First collect all unique variables
  const variables = new Set<string>();
  tokens.tokens.forEach(token => {
    if (token.metadata?.variableName) {
      variables.add(token.metadata.variableName);
    }
  });

  // Generate variables section
  let output = "// Generated SCSS Variables\n";
  Array.from(variables).forEach(varName => {
    const token = tokens.tokens.find(t => t.metadata?.variableName === varName);
    if (token?.rawValue) {
      output += `$${Utils.sanitizeName(varName)}: ${token.rawValue}\n`;
    }
  });

  // Generate mixins section
  output += "\n// Generated SCSS Mixins\n";
  const componentGroups = groupBy(tokens.tokens, t => t.path.join('_'));

  Object.entries(componentGroups).forEach(([componentPath, tokens]) => {
    if (!componentPath) return;
    output += `@mixin ${componentPath}\n`;
    tokens.forEach(token => {
      output += `  ${token.property}: ${token.value}\n`;
    });
    output += "\n";
  });

  return output;
}

// Helper function
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const k = key(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Define processors for different node types
const textNodeProcessors: StyleProcessor[] = [
  {
    property: "color",
    bindingKey: "fills",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "font-size",
    bindingKey: "fontSize",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "font-weight",
    bindingKey: "fontWeight",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "line-height",
    bindingKey: "lineHeight",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "letter-spacing",
    bindingKey: "letterSpacing",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "font-family",
    bindingKey: "fontFamily",
    process: async (variable, node?: SceneNode) => {
      if (variable) {
        return getVariableFallback(variable);
      }
      // Fallback to direct font family if no variable
      if (node?.type === "TEXT") {
        const fontName = node.fontName as FontName;
        return `"${fontName.family}"`;
      }
      return "inherit";
    }
  }
];

const frameNodeProcessors: StyleProcessor[] = [
  {
    property: "background-color",
    bindingKey: "fills",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "border-color",
    bindingKey: "strokes",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "border-width",
    bindingKey: "strokeWeight",
    process: async (variable) => getVariableFallback(variable)
  },
  {
    property: "border-radius",
    bindingKey: "cornerRadius",
    process: async (variable) => {
      const value = await getVariableFallback(variable);
      return value.endsWith('px') ? value : `${value}px`;
    }
  },
  {
    property: "display",
    bindingKey: "fills",
    process: async (_, node?: SceneNode) => {
      if (node && 'layoutMode' in node) {
        return node.layoutMode ? "flex" : "block";
      }
      return "block";
    }
  },
  {
    property: "flex-direction",
    bindingKey: "fills",
    process: async (_, node?: SceneNode) => {
      if (node && 'layoutMode' in node) {
        return node.layoutMode === "VERTICAL" ? "column" : "row";
      }
      return "column";
    }
  },
  {
    property: "align-items",
    bindingKey: "fills",
    process: async (_, node?: SceneNode) => {
      if (node && 'primaryAxisAlignItems' in node) {
        const alignMap = {
          MIN: "flex-start",
          CENTER: "center",
          MAX: "flex-end",
          SPACE_BETWEEN: "space-between"
        };
        return alignMap[node.primaryAxisAlignItems] || "flex-start";
      }
      return "flex-start";
    }
  }
];

// Handle direct properties
function getDirectNodeValue(node: SceneNode, property: string): string | null {
  if (node.type === "FRAME" || node.type === "RECTANGLE" || node.type === "INSTANCE") {
    switch (property) {
      case "border-width":
        return node.strokeWeight ? `${String(node.strokeWeight)}px` : null;
      case "border-radius":
        return node.cornerRadius ? `${String(node.cornerRadius)}px` : null;
      default:
        return null;
    }
  }
  return null;
}

function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case "TEXT":
      return textNodeProcessors;
    case "FRAME":
    case "RECTANGLE":
    case "INSTANCE":
      return frameNodeProcessors;
    default:
      return [];
  }
}

async function getVariableFallback(variable: Variable | null): Promise<string> {
  if (!variable) return '';

  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  // Handle variable aliases first
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasVariable = await figma.variables.getVariableByIdAsync(value.id);
    if (aliasVariable) {
      return getVariableFallback(aliasVariable);
    }
  }

  switch (variable.resolvedType) {
    case "FLOAT":
      return `${value as number}px`;
    case "COLOR": {
      // Handle direct color values
      if (typeof value === 'object' && 'r' in value) {
        return Utils.rgbToHex(value.r, value.g, value.b);
      }

      return '#000000';
    }
    case "STRING":
      return value as string;
    default:
      return "inherit";
  }
}

function getNodePathName(node: SceneNode): string {
  const pathParts: string[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    // Skip if the name is "components"
    if (current.name.toLowerCase() !== "components") {
      pathParts.push(current.name);
    }
    current = current.parent as SceneNode;
  }

  pathParts.reverse();

  const processed = pathParts.map((p) => parseVariantWithoutKey(p));

  return processed.join("_");
}

function parseVariantWithoutKey(variant: string): string {
  const [_, valueRaw] = variant.split("=");
  if (!valueRaw) {
    // if no '=' found, just sanitize as fallback
    return Utils.sanitizeSegment(variant);
  }
  return Utils.sanitizeSegment(valueRaw);
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-styles') {
    const styles = await generateStyles(msg.format || 'scss');
    figma.ui.postMessage({ type: 'output-styles', styles });
  } else if (msg.type === 'save-config') {
    await Github.saveUserSettings(msg.githubToken, msg.branchName);
    await Github.saveGithubConfig({
      repoPath: msg.repoPath,
      filePath: msg.filePath,
    });
    figma.ui.postMessage({ type: 'config-saved' });
  } else if (msg.type === 'load-config') {
    const [config, userSettings] = await Promise.all([
      Github.getGithubConfig(),
      Github.getUserSettings()
    ]);
    if (userSettings) {
      config.githubToken = userSettings.token;
      config.branchName = userSettings.branchName;
    }
    figma.ui.postMessage({ type: 'config-loaded', config });
  } else if (msg.type === 'create-pr') {
    try {
      const result = await Github.createGithubPR(
        msg.githubToken,
        msg.repoPath,
        msg.filePath,
        msg.branchName,
        msg.content
      );
      figma.ui.postMessage({
        type: 'pr-created',
        prUrl: result.prUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({ type: 'error', message });
    }
  }
};
