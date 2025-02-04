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
  
  // Add layout properties
  if ('layoutMode' in node) baseData.layoutMode = node.layoutMode;
  if ('layoutAlign' in node) baseData.layoutAlign = node.layoutAlign;
  if ('primaryAxisAlignItems' in node) baseData.primaryAxisAlignItems = node.primaryAxisAlignItems;
  if ('counterAxisAlignItems' in node) baseData.counterAxisAlignItems = node.counterAxisAlignItems;
  if ('primaryAxisSizingMode' in node) baseData.primaryAxisSizingMode = node.primaryAxisSizingMode;
  if ('counterAxisSizingMode' in node) baseData.counterAxisSizingMode = node.counterAxisSizingMode;
  if ('itemSpacing' in node) baseData.itemSpacing = node.itemSpacing;
  
  // Add size properties
  if ('width' in node) baseData.width = node.width;
  if ('height' in node) baseData.height = node.height;
  if ('minWidth' in node) baseData.minWidth = node.minWidth;
  if ('maxWidth' in node) baseData.maxWidth = node.maxWidth;
  if ('minHeight' in node) baseData.minHeight = node.minHeight;
  if ('maxHeight' in node) baseData.maxHeight = node.maxHeight;
  
  // Add padding properties
  if ('paddingTop' in node) {
    baseData.paddingTop = node.paddingTop;
    baseData.paddingRight = node.paddingRight;
    baseData.paddingBottom = node.paddingBottom;
    baseData.paddingLeft = node.paddingLeft;
  }

  // Add text properties
  if ('fontSize' in node) baseData.fontSize = node.fontSize;
  if ('fontName' in node) baseData.fontName = node.fontName;
  if ('lineHeight' in node) baseData.lineHeight = node.lineHeight;
  if ('letterSpacing' in node) baseData.letterSpacing = node.letterSpacing;
  
  // Add variables and constraints
  if ('boundVariables' in node) baseData.boundVariables = node.boundVariables;
  if ('constraints' in node) baseData.constraints = node.constraints;
  if ('layoutGrow' in node) baseData.layoutGrow = node.layoutGrow;
  if ('layoutPositioning' in node) baseData.layoutPositioning = node.layoutPositioning;

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
  // Helper to collect and flatten all variables including aliases
  const collectAllVariables = (variables: Record<string, any>) => {
    const allVariables = new Map<string, any>();
    
    const addVariable = (varId: string) => {
      if (allVariables.has(varId)) return;
      
      const variable = variables[varId];
      if (!variable) return;
      
      allVariables.set(varId, variable);
      
      // Recursively collect any alias references
      Object.values(variable.valuesByMode).forEach((value: any) => {
        if (isVariableAlias(value)) {
          addVariable(value.id);
        }
      });
    };

    // Start with root variables
    Object.keys(variables).forEach(addVariable);
    return allVariables;
  };

  const variableMap = collectAllVariables(testData.variables);

  return async (id: string): Promise<Variable | null> => {
    const variable = variableMap.get(id);
    if (!variable) return null;

    // Helper to resolve any alias values
    const resolveValue = async (value: any): Promise<any> => {
      if (isVariableAlias(value)) {
        const aliasVar = variableMap.get(value.id);
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
      resolvedType: variable.resolvedType,
      valuesByMode: {
        [modeId]: resolvedValue
      }
    } as Variable;
  };
}

export function createTestData(jsonData: any) {
  const processNode = (node: BaseNode, parentNode: BaseNode | null, parentPath = '') => {
    const nodePath = parentPath ? `${parentPath}_${node.name}` : node.name;

    if (node.type === 'TEXT') {
      return {
        ...node,
        parent: parentNode,
        name: nodePath,
        width: (node as any).width || 100,
        height: (node as any).height || 20,
        textAutoResize: (node as any).textAutoResize || "NONE"
      } as TextNode;
    }

    const frameNode = {
      ...node,
      type: node.type || 'FRAME',
      parent: parentNode,
      name: nodePath,
      children: []
    } as unknown as FrameNode;

    if ('children' in node) {
      (frameNode as any).children = (node.children as BaseNode[])
        .map(child => processNode(child, frameNode, nodePath));
    }

    return frameNode;
  };

  const pageNode = {
    ...jsonData,
    type: 'PAGE',
    parent: null,
    children: jsonData.children.map((child: BaseNode) => 
      processNode(child, null, '')
    )
  } as PageNode;

  pageNode.children.forEach(child => (child as any).parent = pageNode);

  return {
    pageNode,
    async setupTest() {
      const getVariableByIdAsync = await createTestVariableResolver(jsonData);
      return {
        figma: {
          currentPage: pageNode,
          variables: {
            getVariableByIdAsync
          }
        }
      };
    }
  };
} 