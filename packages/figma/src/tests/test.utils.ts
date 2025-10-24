import { isVariableAlias } from '../utils/is-variable-alias.utils';

async function createTestVariableResolver(testData: { variables: Record<string, unknown> }) {
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
    const resolvedValue = await resolveValue((variable as Variable).valuesByMode[modeId]);

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
export function createTestData(jsonData: {
  children: unknown[];
  variables: Record<string, unknown>;
}) {
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
    children: (jsonData.children as PageNode['children']).map((child) => processNode(child, null)),
  } as unknown as PageNode;

  pageNode.children.forEach(
    (child) => ((child as unknown as { parent: PageNode | null }).parent = pageNode),
  );

  return {
    pageNode,
    async setupTest() {
      const getVariableByIdAsync = await createTestVariableResolver(
        jsonData as Parameters<typeof createTestVariableResolver>[0],
      );

      // Create a mock variable collection with all variables
      const mockVariableCollection = {
        name: 'Default',
        id: 'default-collection',
        variableIds: Object.keys(jsonData.variables),
      };

      return {
        figma: {
          currentPage: pageNode,
          root: {
            children: [pageNode], // Array of pages
          },
          getLocalEffectStylesAsync: () => Promise.resolve([]), // Stub this method
          loadAllPagesAsync: () => Promise.resolve(undefined), // Stub this method
          variables: {
            getVariableByIdAsync,
            getLocalVariableCollectionsAsync: () =>
              Promise.resolve([mockVariableCollection] as VariableCollection[]),
          },
        },
      };
    },
  };
}
