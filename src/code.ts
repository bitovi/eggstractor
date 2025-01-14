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
  gap?: VariableAlias | VariableAlias[];
  paddingTop?: VariableAlias | VariableAlias[];
  paddingRight?: VariableAlias | VariableAlias[];
  paddingBottom?: VariableAlias | VariableAlias[];
  paddingLeft?: VariableAlias | VariableAlias[];
}

interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings | undefined;
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
      const nodePath = getNodePathName(node as SceneNode).split('_');
      
      // Process layout properties for variant components
      if (node.type === "COMPONENT") {
        const processors = frameNodeProcessors.filter(p => 
          ['display', 'flex-direction', 'align-items', 'gap', 
           'padding-top', 'padding-right', 'padding-bottom', 'padding-left'].includes(p.property)
        );
        
        for (const processor of processors) {
          // Get the direct value from the component
          const directValue = getDirectNodeValue(node as SceneNode, processor.property);
          if (directValue) {
            collection.tokens.push({
              type: 'string',
              name: nodePath.join('_'),
              value: directValue,
              rawValue: directValue,
              property: processor.property,
              path: nodePath
            });
          }
        }
      } else {
        // Process other nodes as before
        const processors = getProcessorsForNode(node as SceneNode);
        for (const processor of processors) {
          const token = await extractNodeToken(node as SceneNode, processor, nodePath);
          if (token) {
            collection.tokens.push(token);
          }
        }
      }
    }

    // Process children
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
  // First check for variable bindings
  const customBoundVariables = node.boundVariables as unknown as VariableBindings;
  const binding = processor.bindingKey ? customBoundVariables[processor.bindingKey] : undefined;
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

  // If no variable binding, get direct value
  let directValue: string | null = null;

  // Handle text node properties
  if (node.type === "TEXT") {
    switch (processor.property) {
      case "color":
        if (node.fills && Array.isArray(node.fills)) {
          const fill = node.fills[0] as Paint;
          if (fill?.type === "SOLID") {
            const { r, g, b } = fill.color;
            const a = fill.opacity ?? 1;
            directValue = a === 1 ? 
              Utils.rgbToHex(r, g, b) : 
              `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          }
        }
        break;
      case "font-family":
        if (!variableId && node.fontName && typeof node.fontName === 'object') {
          const fontName = node.fontName as FontName;
          directValue = fontName.family;
        }
        break;
      case "font-size":
        directValue = `${String(node.fontSize)}px`;
        break;
      case "font-weight":
        directValue = String(node.fontWeight);
        break;
      case "line-height":
        if ('lineHeight' in node) {
          const lineHeight = node.lineHeight;
          if (typeof lineHeight === 'object') {
            if (lineHeight.unit === "AUTO") {
              directValue = "normal";
            } else {
              directValue = `${lineHeight.value}${lineHeight.unit.toLowerCase() === "percent" ? '%' : 'px'}`;
            }
          }
        }
        break;
      case "letter-spacing":
        if ('letterSpacing' in node) {
          const letterSpacing = node.letterSpacing;
          if (typeof letterSpacing === 'object' && letterSpacing.value !== 0) {
            directValue = `${letterSpacing.value}${letterSpacing.unit.toLowerCase() === "percent" ? '%' : 'px'}`;
          }
        }
        break;
    }
  }
  // Handle frame/component/instance properties
  else if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "RECTANGLE") {
    directValue = getDirectNodeValue(node, processor.property);
  }

  if (directValue && directValue !== "inherit") {
    return {
      type: 'string',
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
  
  const variantGroups = groupBy(tokens.tokens, t => t.path.join('_'));

  Object.entries(variantGroups).forEach(([variantPath, tokens]) => {
    if (!variantPath) return;

    // Sort tokens to put layout properties first
    const layoutProperties = [
      'display', 
      'flex-direction', 
      'align-items', 
      'gap',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left'
    ];
    const sortedTokens = tokens.sort((a, b) => {
      const aIndex = layoutProperties.indexOf(a.property);
      const bIndex = layoutProperties.indexOf(b.property);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Remove duplicate and inherited properties
    const uniqueTokens = sortedTokens.reduce((acc, token) => {
      const existing = acc.find(t => t.property === token.property);
      if (!existing && token.value !== 'inherit') {
        acc.push(token);
      }
      return acc;
    }, [] as StyleToken[]);

    // Only output mixin if there are non-inherited properties
    if (uniqueTokens.length > 0) {
      output += `@mixin ${variantPath}\n`;
      uniqueTokens.forEach(token => {
        output += `  ${token.property}: ${token.value}\n`;
      });
      output += "\n";
    }
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
    process: async (variable) => getVariableFallback(variable)
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
    bindingKey: undefined,
    process: async (_, node?: SceneNode) => {
      if (node && 'layoutMode' in node) {
        return node.layoutMode ? (node.layoutAlign === "STRETCH" ? "flex" : "inline-flex") : "block";
      }
      return "block";
    }
  },
  {
    property: "flex-direction",
    bindingKey: undefined,
    process: async (_, node?: SceneNode) => {
      if (node && 'layoutMode' in node) {
        return node.layoutMode === "VERTICAL" ? "column" : "row";
      }
      return "column";
    }
  },
  {
    property: "align-items",
    bindingKey: undefined,
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
  },
  {
    property: "gap",
    bindingKey: "itemSpacing",
    process: async (variable, node?: SceneNode) => {
      if (variable) {
        return getVariableFallback(variable);
      }
      // Fallback to direct itemSpacing if no variable
      if (node && 'itemSpacing' in node) {
        return `${node.itemSpacing}px`;
      }
      return "0";
    }
  },
  {
    property: "padding",
    bindingKey: undefined,
    process: async (_, node?: SceneNode) => {
      if (node && 'paddingTop' in node) {
        const top = node.paddingTop;
        const right = node.paddingRight;
        const bottom = node.paddingBottom;
        const left = node.paddingLeft;

        // If all sides are equal
        if (top === right && right === bottom && bottom === left) {
          return `${top}px`;
        }
        // If vertical and horizontal padding are different
        if (top === bottom && left === right) {
          return `${top}px ${left}px`;
        }
        // All sides different
        return `${top}px ${right}px ${bottom}px ${left}px`;
      }
      return "0";
    }
  }
];

// Handle direct properties
function getDirectNodeValue(node: SceneNode, property: string): string | null {
  if (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "RECTANGLE" || node.type === "INSTANCE") {
    switch (property) {
      case "border-width":
        return node.strokeWeight ? `${String(node.strokeWeight)}px` : null;
      case "border-radius":
        return node.cornerRadius ? `${String(node.cornerRadius)}px` : null;
      case "gap":
        if ('layoutMode' in node && 'itemSpacing' in node) {
          return node.layoutMode && node.itemSpacing > 0 ? `${node.itemSpacing}px` : null;
        }
        return null;
      case "display":
        if ('layoutMode' in node) {
          if (!node.layoutMode) return "block";
          // Check for auto-layout properties
          const isInline = node.layoutAlign !== "STRETCH";
          return isInline ? "inline-flex" : "flex";
        }
        return null;
      case "flex-direction":
        if ('layoutMode' in node) {
          if (!node.layoutMode) return null;
          return node.layoutMode === "VERTICAL" ? "column" : "row";
        }
        return null;
      case "align-items":
        if ('layoutMode' in node && 'primaryAxisAlignItems' in node) {
          if (!node.layoutMode) return null;
          const alignMap = {
            MIN: "flex-start",
            CENTER: "center",
            MAX: "flex-end",
            SPACE_BETWEEN: "space-between"
          };
          return alignMap[node.primaryAxisAlignItems] || "flex-start";
        }
        return null;
      case "padding":
        if ('paddingTop' in node) {
          const top = node.paddingTop;
          const right = node.paddingRight;
          const bottom = node.paddingBottom;
          const left = node.paddingLeft;

          // If all sides are equal
          if (top === right && right === bottom && bottom === left) {
            return `${top}px`;
          }
          // If vertical and horizontal padding are different
          if (top === bottom && left === right) {
            return `${top}px ${left}px`;
          }
          // All sides different
          return `${top}px ${right}px ${bottom}px ${left}px`;
        }
        return null;
      case "padding-top":
        return 'paddingTop' in node ? `${node.paddingTop}px` : null;
      case "padding-right":
        return 'paddingRight' in node ? `${node.paddingRight}px` : null;
      case "padding-bottom":
        return 'paddingBottom' in node ? `${node.paddingBottom}px` : null;
      case "padding-left":
        return 'paddingLeft' in node ? `${node.paddingLeft}px` : null;
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
