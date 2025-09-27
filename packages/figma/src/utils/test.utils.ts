export async function serializeFigmaData(node: BaseNode): Promise<unknown> {
  // Properties to exclude from serialization
  const excludedProps = new Set([
    'inferredVariables',
    'availableInferredVariables',
    // Add other properties to exclude here
  ]);

  // Create base data with all enumerable properties
  const baseData: Record<string, unknown> = {};

  // Get all properties from the node
  for (const key in node) {
    try {
      // Skip excluded properties
      if (excludedProps.has(key)) {
        continue;
      }

      const value = node[key as keyof BaseNode];
      // Skip functions and undefined values
      if (typeof value === 'function' || value === undefined) {
        continue;
      }
      baseData[key] = value;
    } catch {
      // Some properties might throw when accessed, skip those
      continue;
    }
  }

  // Recursively process children
  if ('children' in node) {
    baseData.children = await Promise.all(
      node.children.map((child) => serializeFigmaData(child)),
    );
  }

  // Add variables collection
  const variables: Record<string, unknown> = {};

  // Helper to collect variables from node
  const collectVariables = async (node: SceneNode) => {
    if ('boundVariables' in node) {
      for (const key in node.boundVariables) {
        const vars = (
          node.boundVariables as Record<string, VariableAlias | VariableAlias[]>
        )[key];
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
      await Promise.all(
        node.children.map((child) => collectVariables(child as SceneNode)),
      );
    }
  };

  async function collectVariableAndAliases(
    variableId: string,
    variables: Record<string, unknown>,
  ) {
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

function isVariableAlias(
  value: unknown,
): value is { type: 'VARIABLE_ALIAS'; id: string } {
  if (!value) return false;
  return (
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'VARIABLE_ALIAS' &&
    'id' in value
  );
}

export async function createTestVariableResolver(testData: {
  variables: Record<string, unknown>;
}) {
  // Helper to collect and flatten all variables including aliases
  const collectAllVariables = (variables: Record<string, unknown>) => {
    const allVariables = new Map<string, unknown>();

    const addVariable = (varId: string) => {
      if (allVariables.has(varId)) return;

      const variable = variables[varId] as Variable | undefined;
      if (!variable) return;

      allVariables.set(varId, variable);

      // Recursively collect any alias references
      Object.values(variable.valuesByMode).forEach((value: unknown) => {
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
    const resolveValue = async (value: unknown): Promise<unknown> => {
      if (isVariableAlias(value)) {
        const aliasVar = variableMap.get(value.id);
        if (!aliasVar) return null;

        const modeId = Object.keys((aliasVar as Variable).valuesByMode)[0];
        return resolveValue((aliasVar as Variable).valuesByMode[modeId]);
      }
      return value;
    };

    const modeId = Object.keys((variable as Variable).valuesByMode).sort()[0];
    const resolvedValue = await resolveValue(
      (variable as Variable).valuesByMode[modeId],
    );

    return {
      ...variable,
      resolvedType: (variable as Variable).resolvedType,
      valuesByMode: {
        [modeId]: resolvedValue,
      },
    } as Variable;
  };
}

// TODO: the types are terrible here, improve them
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTestData(jsonData: any) {
  const processNode = (node: BaseNode, parentNode: BaseNode | null) => {
    if (node.type === 'TEXT') {
      return {
        ...node,
        parent: parentNode,
        name: node.name,
        width: node.width || 100,
        height: node.height || 20,
        textAutoResize: node.textAutoResize || 'NONE',
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
      // Avoid that FrameNode children is readonly with a type assertion
      (frameNode as { children: FrameNode['children'] }).children = (
        node.children as BaseNode[]
      ).map((child) => processNode(child, frameNode));
    }

    return frameNode;
  };

  const pageNode = {
    ...jsonData,
    type: 'PAGE',
    parent: null,
    children: (jsonData.children as PageNode['children']).map((child) =>
      processNode(child, null),
    ),
  } as unknown as PageNode;

  pageNode.children.forEach(
    (child) =>
      ((child as unknown as { parent: PageNode | null }).parent = pageNode),
  );

  return {
    pageNode,
    async setupTest() {
      const getVariableByIdAsync = await createTestVariableResolver(
        jsonData as Parameters<typeof createTestVariableResolver>[0],
      );
      return {
        figma: {
          currentPage: pageNode,
          root: {
            children: [pageNode], // Array of pages
          },
          loadAllPagesAsync: vi.fn().mockResolvedValue(undefined), // Mock this method
          variables: {
            getVariableByIdAsync,
          },
        },
      };
    },
  };
}
