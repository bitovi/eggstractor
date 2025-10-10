import { isVariableAlias } from './is-variable-alias.utils';

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
    baseData.children = await Promise.all(node.children.map((child) => serializeFigmaData(child)));
  }

  // Add variables collection
  const variables: Record<string, unknown> = {};

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

  async function collectVariableAndAliases(variableId: string, variables: Record<string, unknown>) {
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
