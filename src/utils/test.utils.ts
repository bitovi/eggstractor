export async function serializeFigmaData(node: BaseNode): Promise<any> {
  const baseData: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // Add specific node properties based on type
  if ('fills' in node) baseData.fills = node.fills;
  if ('strokes' in node) baseData.strokes = node.strokes;
  if ('strokeWeight' in node) baseData.strokeWeight = node.strokeWeight;
  if ('cornerRadius' in node) baseData.cornerRadius = node.cornerRadius;
  if ('layoutMode' in node) baseData.layoutMode = node.layoutMode;
  if ('layoutAlign' in node) baseData.layoutAlign = node.layoutAlign;
  if ('primaryAxisAlignItems' in node) baseData.primaryAxisAlignItems = node.primaryAxisAlignItems;
  if ('itemSpacing' in node) baseData.itemSpacing = node.itemSpacing;
  if ('paddingTop' in node) {
    baseData.paddingTop = node.paddingTop;
    baseData.paddingRight = node.paddingRight;
    baseData.paddingBottom = node.paddingBottom;
    baseData.paddingLeft = node.paddingLeft;
  }
  if ('fontSize' in node) baseData.fontSize = node.fontSize;
  if ('fontName' in node) baseData.fontName = node.fontName;
  if ('lineHeight' in node) baseData.lineHeight = node.lineHeight;
  if ('letterSpacing' in node) baseData.letterSpacing = node.letterSpacing;
  if ('boundVariables' in node) baseData.boundVariables = node.boundVariables;

  // Recursively process children
  if ('children' in node) {
    baseData.children = await Promise.all(
      node.children.map(child => serializeFigmaData(child))
    );
  }

  // Add variables collection
  const variables: Record<string, any> = {};
  
  // Helper to collect variables from node
  const collectVariables = async (node: SceneNode) => {
    if ('boundVariables' in node) {
      for (const key in node.boundVariables) {
        const vars = (node.boundVariables as Record<string, VariableAlias | VariableAlias[]>)[key];
        if (Array.isArray(vars)) {
          for (const v of vars) {
            if (v.id) {
              const variable = await figma.variables.getVariableByIdAsync(v.id);
              if (variable) {
                variables[v.id] = {
                  id: variable.id,
                  name: variable.name,
                  valuesByMode: variable.valuesByMode
                };
              }
            }
          }
        } else if (vars?.id) {
          const variable = await figma.variables.getVariableByIdAsync(vars.id);
          if (variable) {
            variables[vars.id] = {
              id: variable.id,
              name: variable.name,
              valuesByMode: variable.valuesByMode
            };
          }
        }
      }
    }
    
    if ('children' in node) {
      await Promise.all(node.children.map(child => collectVariables(child as SceneNode)));
    }
  };

  // Collect variables if it's a SceneNode
  if ('type' in node) {
    await collectVariables(node as SceneNode);
  }

  return {
    ...baseData,
    variables
  };
} 