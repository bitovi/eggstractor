/// <reference types="@figma/plugin-typings" />
/// <reference path="./utils.ts" />
/// <reference path="./github.ts" />

// Show the UI with resizable window
figma.showUI(__html__, { 
  width: 600,
  height: 1200,
  themeColors: true,
  title: "SCSS Generator",
});

interface ScrapedStyle {
  property: string;
  scssValue: string;
}

interface ScssExportContext {
  nodeStyles: Record<string, ScrapedStyle[]>;
  declaredVars: Set<string>;
  variableDeclarations: string;
}

interface VariableBindings {
  fills?: VariableAlias | VariableAlias[];
  strokes?: VariableAlias | VariableAlias[];
  strokeWeight?: VariableAlias | VariableAlias[];
  fontSize?: VariableAlias | VariableAlias[];
  fontWeight?: VariableAlias | VariableAlias[];
  lineHeight?: VariableAlias | VariableAlias[];
  letterSpacing?: VariableAlias | VariableAlias[];
}

interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings;
  process: (value: Variable) => Promise<string>;
}

async function traverseNode(node: BaseNode, context: ScssExportContext) {
  // Extract any styles from the node if it's a SceneNode
  if ('type' in node) {
    await extractNodeStyles(node as SceneNode, context);
  }

  // Recurse if it has children
  if ("children" in node) {
    for (const child of node.children) {
      await traverseNode(child, context);
    }
  }
}
async function traverseDocument(context: ScssExportContext) {
  const page = figma.currentPage;
  await traverseNode(page, context);
}

async function generateScss(): Promise<string> {
  // Prepare context
  const context: ScssExportContext = {
    nodeStyles: {},
    declaredVars: new Set(),
    variableDeclarations: "// Generated SCSS variables\n"
  };

  // Traverse the current page (or the entire document if you prefer)
  await traverseDocument(context);

  // Build mixins from the collected styles
  const mixins = buildScssMixins(context);

  // Combine final output
  const scssOutput = context.variableDeclarations + "\n" + mixins;
  return scssOutput;
}

function buildScssMixins(context: ScssExportContext): string {
  let mixinOutput = "// Generated SCSS Mixins\n";
  const nodePaths = Object.keys(context.nodeStyles);

  for (const path of nodePaths) {
    const styleArray = context.nodeStyles[path];
    if (!styleArray || styleArray.length === 0) continue;

    mixinOutput += `@mixin ${path} {\n`;
    for (const st of styleArray) {
      mixinOutput += `  ${st.property}: ${st.scssValue};\n`;
    }
    mixinOutput += `}\n\n`;
  }

  return mixinOutput;
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
  }
];

async function extractNodeStyles(node: SceneNode, context: ScssExportContext) {
  if (node.type === "COMPONENT") return;

  const pathName = getNodePathName(node);
  if (!pathName) return;

  // Debug log the entire node's boundVariables
  console.log('Node bound variables:', {
    nodeName: node.name,
    nodeType: node.type,
    boundVariables: node.boundVariables,
    // If it's a frame, also log stroke properties
    strokeWeight: node.type === "FRAME" ? (node as FrameNode).strokeWeight : undefined,
    strokes: node.type === "FRAME" ? (node as FrameNode).strokes : undefined
  });

  const styles = new Map<string, ScrapedStyle>();
  const processors = getProcessorsForNode(node);
  
  // Process each style
  for (const processor of processors) {
    const binding = node.boundVariables?.[processor.bindingKey];
    console.log('Processing:', {
      nodeType: node.type,
      property: processor.property,
      bindingKey: processor.bindingKey,
      hasBinding: !!binding,
      binding
    });
    const firstBinding = binding && Array.isArray(binding) ? binding[0] : binding;

    if (firstBinding?.id) {
      const variable = await figma.variables.getVariableByIdAsync(firstBinding.id);
      if (variable) {
        const value = await processor.process(variable);
        const scssName = declareScssVariable(variable.name, value, context);
        styles.set(processor.property, { 
          property: processor.property, 
          scssValue: scssName 
        });
      }
    }
  }

  if (styles.size > 0) {
    context.nodeStyles[pathName] = Array.from(styles.values());
  }
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

function declareScssVariable(
  varName: string,
  fallback: string,
  context: ScssExportContext
): string {
  // e.g. `$global-colour-textonlight`
  const scssVarName = `$${Utils.sanitizeName(varName)}`;
  if (!context.declaredVars.has(varName)) {
    // Append the declaration line
    context.variableDeclarations += `${scssVarName}: ${fallback};\n`;
    context.declaredVars.add(varName);
  }
  return scssVarName;
}

async function getVariableFallback(variable: Variable): Promise<string> {
  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];
  
  switch (variable.resolvedType) {
    case "COLOR": {
      // Handle direct color values
      if (typeof value === 'object' && 'r' in value) {
        return Utils.rgbToHex(value.r, value.g, value.b);
      }
      
      // Handle variable aliases
      if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        const aliasVariable = await figma.variables.getVariableByIdAsync(value.id);
        if (aliasVariable) {
          // Recursively resolve the alias
          return getVariableFallback(aliasVariable);
        }
      }
      return '#000000';
    }
    case "STRING":
      return value as string;
    case "FLOAT":
      return `${value as number}px`;
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

// Add this function to handle config
async function getGithubConfig() {
  try {
    const savedConfig = figma.root.getPluginData('githubConfig');
    return savedConfig ? JSON.parse(savedConfig) : null;
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-scss') {
    const scss = await generateScss();
    figma.ui.postMessage({ type: 'output-scss', scss });
  } else if (msg.type === 'save-config') {
    await figma.root.setPluginData('githubConfig', JSON.stringify({
      repoPath: msg.repoPath,
      filePath: msg.filePath,
      branchName: msg.branchName
    }));
    figma.ui.postMessage({ type: 'config-saved' });
  } else if (msg.type === 'load-config') {
    const config = await getGithubConfig();
    figma.ui.postMessage({ type: 'config-loaded', config });
  } else if (msg.type === 'create-pr') {
    try {
      const prUrl = await Github.createGithubPR(
        msg.githubToken,
        msg.repoPath,
        msg.filePath,
        msg.branchName,
        msg.content
      );
      figma.ui.postMessage({ type: 'pr-created', prUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({ type: 'error', message });
    }
  }
};
