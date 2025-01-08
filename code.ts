// Show the UI with resizable window
figma.showUI(__html__, { 
  width: 600,
  height: 800,
  themeColors: true,
  title: "SCSS Generator",
});

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function traverseNodes(node: BaseNode, callback: (node: SceneNode) => void) {
  if ('type' in node) {
    callback(node as SceneNode);
  }
  if ('children' in node) {
    for (const child of node.children) {
      traverseNodes(child, callback);
    }
  }
}

async function generateSCSS() {
  const state = createState();

  // Iterate over each selected node on the current page
  traverseNodes(figma.currentPage, (node) => {
    const baseName = sanitizeName(node.name);
    processBackgroundColor(node, baseName, state);
    processFontColor(node, baseName, state);
  });

  // Format mixins with proper indentation
  let styleRules = "// Generated SCSS style rules\n";
  for (const baseName in state.styleRulesByNode) {
    const styles = state.styleRulesByNode[baseName]
      .split('\n')
      .filter(line => line.trim())
      .map(line => `  ${line.trim()}`)
      .join('\n');
    
    if (styles) {
      styleRules += `@mixin ${baseName} {\n${styles}\n}\n\n`;
    }
  }
  
  return state.variableDeclarations + "\n" + styleRules;
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-scss') {
    const scss = await generateSCSS();
    // Send the generated SCSS back to the UI
    figma.ui.postMessage({ type: 'output-scss', scss });
  }
};

interface PluginState {
  generatedVariables: Set<string>;
  styleRulesByNode: { [key: string]: string };
  variableDeclarations: string;
}

function createState(): PluginState {
  return {
    generatedVariables: new Set(),
    styleRulesByNode: {},
    variableDeclarations: "// Generated SCSS variables\n",
  };
}

function sanitizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function processBackgroundColor(node: SceneNode, baseName: string, state: PluginState) {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills) || node.fills.length === 0) return;
  
  if (!state.styleRulesByNode[baseName]) {
    state.styleRulesByNode[baseName] = '';
  }
  
  for (const fill of node.fills) {
    if (fill.type === 'SOLID' && fill.visible !== false) {
      const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      const varName = `${baseName}-background-color`;

      if (!state.generatedVariables.has(varName)) {
        state.variableDeclarations += `$${varName}: ${hexColor};\n`;
        state.generatedVariables.add(varName);
      }
  
      const styleLine = `background-color: $${varName};`;
      if (!state.styleRulesByNode[baseName].includes(styleLine)) {
        state.styleRulesByNode[baseName] += styleLine + '\n';
      }
    }
  }
}

function processFontColor(node: SceneNode, baseName: string, state: PluginState) {
  if (node.type !== 'TEXT' || !node.fills || !Array.isArray(node.fills) || node.fills.length === 0) return;
  
  if (!state.styleRulesByNode[baseName]) {
    state.styleRulesByNode[baseName] = '';
  }
  
  const fill = node.fills[0] as Paint;
  if (fill.type === 'SOLID') {
    const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
    const varName = `${baseName}-font-color`;
  
    if (!state.generatedVariables.has(varName)) {
      state.variableDeclarations += `$${varName}: ${hexColor};\n`;
      state.generatedVariables.add(varName);
    }
    
    const styleLine = `color: $${varName};`;
    if (!state.styleRulesByNode[baseName].includes(styleLine)) {
      state.styleRulesByNode[baseName] += styleLine + '\n';
    }
  }
}
