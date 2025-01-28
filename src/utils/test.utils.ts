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
              await collectVariableAndAliases(v.id, variables);
            }
          }
        } else if (vars?.id) {
          await collectVariableAndAliases(vars.id, variables);
        }
      }
    }
    
    if ('children' in node) {
      await Promise.all(node.children.map(child => collectVariables(child as SceneNode)));
    }
  };

  async function collectVariableAndAliases(variableId: string, variables: Record<string, any>) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) return;

    // Store the current variable
    variables[variableId] = {
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      valuesByMode: variable.valuesByMode
    };

    // Check for aliases in all modes
    for (const modeId in variable.valuesByMode) {
      const value = variable.valuesByMode[modeId];
      if (isVariableAlias(value)) {
        await collectVariableAndAliases(value.id, variables);
      }
    }
  }

  // Collect variables if it's a SceneNode
  if ('type' in node) {
    await collectVariables(node as SceneNode);
  }

  return {
    ...baseData,
    variables
  };
}

function isVariableAlias(value: any): value is { type: 'VARIABLE_ALIAS', id: string } {
  return value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS' && 'id' in value;
}

export async function createTestVariableResolver(testData: any) {
  // Collect all variables including aliases
  const collectAllVariables = (variables: Record<string, any>) => {
    const allVariables: Record<string, any> = {};
    
    const resolveVariable = (varId: string) => {
      const variable = variables[varId];
      if (!variable) return;
      
      allVariables[varId] = variable;
      
      // Check for aliases in all modes
      Object.values(variable.valuesByMode).forEach((value: any) => {
        if (isVariableAlias(value)) {
          resolveVariable(value.id);
        }
      });
    };

    // Start with all root variables
    Object.keys(variables).forEach(resolveVariable);
    return allVariables;
  };

  const allVariables = collectAllVariables(testData.variables);

  return async (id: string): Promise<Variable | null> => {
    const variable = allVariables[id];
    if (!variable) return null;

    // Resolve any aliases in the variable
    const resolveValue = async (value: any): Promise<any> => {
      if (isVariableAlias(value)) {
        const aliasVar = allVariables[value.id];
        if (!aliasVar) return null;
        
        const modeId = Object.keys(aliasVar.valuesByMode)[0];
        return resolveValue(aliasVar.valuesByMode[modeId]);
      }
      return value;
    };

    const modeId = Object.keys(variable.valuesByMode)[0];
    const resolvedValue = await resolveValue(variable.valuesByMode[modeId]);

    return {
      ...variable,
      resolvedType: "COLOR",
      valuesByMode: {
        [modeId]: resolvedValue
      }
    } as unknown as Variable;
  };
} 