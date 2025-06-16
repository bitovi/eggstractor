export async function serializeFigmaData(node: BaseNode): Promise<any> {
  // Properties to exclude from serialization
  const excludedProps = new Set([
    'inferredVariables',
    'availableInferredVariables',
    // Add other properties to exclude here
  ]);

  // Create base data with all enumerable properties
  const baseData: any = {};

  // Get all properties from the node
  for (const key in node) {
    try {
      // Skip excluded properties
      if (excludedProps.has(key)) {
        continue;
      }

      const value = (node as any)[key];
      // Skip functions and undefined values
      if (typeof value === 'function' || value === undefined) {
        continue;
      }
      baseData[key] = value;
    } catch (error) {
      // Some properties might throw when accessed, skip those
      continue;
    }
  }

  // Recursively process children
  if ('children' in node) {
    baseData.children = await Promise.all(node.children.map((child) => serializeFigmaData(child)));
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
      await Promise.all(node.children.map((child) => collectVariables(child as SceneNode)));
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
      valuesByMode: variable.valuesByMode,
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
    variables,
  };
}

function isVariableAlias(value: any): value is { type: 'VARIABLE_ALIAS'; id: string } {
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

    const modeId = Object.keys(variable.valuesByMode).sort()[0];
    const resolvedValue = await resolveValue(variable.valuesByMode[modeId]);

    return {
      ...variable,
      resolvedType: variable.resolvedType,
      valuesByMode: {
        [modeId]: resolvedValue,
      },
    } as Variable;
  };
}

export function createTestData(jsonData: any) {
  const processNode = (node: BaseNode, parentNode: BaseNode | null) => {
    if (node.type === 'TEXT') {
      return {
        ...node,
        parent: parentNode,
        name: node.name,
        width: (node as any).width || 100,
        height: (node as any).height || 20,
        textAutoResize: (node as any).textAutoResize || 'NONE',
      } as TextNode;
    }

    const frameNode = {
      ...node,
      type: node.type || 'FRAME',
      parent: parentNode,
      name: node.name,
      children: [],
    } as unknown as FrameNode;

    if ('children' in node) {
      (frameNode as any).children = (node.children as BaseNode[]).map((child) =>
        processNode(child, frameNode),
      );
    }

    return frameNode;
  };

  const pageNode = {
    ...jsonData,
    type: 'PAGE',
    parent: null,
    children: jsonData.children.map((child: BaseNode) => processNode(child, null)),
  } as PageNode;

  pageNode.children.forEach((child) => ((child as any).parent = pageNode));

  return {
    pageNode,
    async setupTest() {
      const getVariableByIdAsync = await createTestVariableResolver(jsonData);
      return {
        figma: {
          currentPage: pageNode,
          root: {
            children: [pageNode], // Array of pages
          },
          loadAllPagesAsync: jest.fn().mockResolvedValue(undefined), // Mock this method
          variables: {
            getVariableByIdAsync,
          },
        },
      };
    },
  };
}
