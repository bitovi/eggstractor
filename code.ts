// Show the UI
figma.showUI(__html__, { width: 400, height: 400 });

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
  let variableDeclarations = "// Generated SCSS variables\n";
  let styleRulesByNode: { [key: string]: string } = {};
  let styleRules = "// Generated SCSS style rules\n";

  // Iterate over each selected node on the current page
  traverseNodes(figma.currentPage, (node) => {
    // Sanitize node name for SCSS mixin naming
    const mixinName = sanitizeName(node.name);

    if (!styleRulesByNode[mixinName]) {
      styleRulesByNode[mixinName] = '';
    }

    const backgroundResult = processBackgroundColor(node, mixinName);
    variableDeclarations += backgroundResult.vars;
    styleRulesByNode[mixinName] += backgroundResult.style;

    const fontColorResult = processFontColor(node, mixinName);
    variableDeclarations += fontColorResult.vars;
    styleRulesByNode[mixinName] += fontColorResult.style;
  });

  for (const baseName in styleRulesByNode) {
    if (styleRulesByNode[baseName].trim()) {
      styleRules += `@mixin ${baseName} {\n${styleRulesByNode[baseName]}}\n\n`;
    }
  }

  return variableDeclarations + "\n" + styleRules;
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-scss') {
    const scss = await generateSCSS();
    // Send the generated SCSS back to the UI
    figma.ui.postMessage({ type: 'output-scss', scss });
  }
};

function sanitizeName(name: string) {
  return name.trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();
}

function processBackgroundColor(node: SceneNode, baseName: string) {
  let vars = '';
  let style = '';
  if ('fills' in node && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.visible !== false) {
        const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        const varName = `${baseName}-background-color`;
        vars += `$${varName}: ${hexColor};\n`;
        style += `  background-color: $${varName};\n`;
      }
    }
  }
  return { vars, style };
}

function processFontColor(node: SceneNode, baseName: string) {
  let vars = '';
  let style = '';
  if (node.type === 'TEXT' && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID') {
      const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      const varName = `${baseName}-font-color`;
      vars += `$${varName}: ${hexColor};\n`;
      style += `  color: $${varName};\n`;
    }
  }
  return { vars, style };
}
