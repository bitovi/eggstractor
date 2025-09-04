import { VariableToken } from '../types';
import { rgbaToString, sanitizeName, normalizeValue } from '../utils';

const variableCache = new Map<string, Variable>();

async function getVariableFallback(variable: Variable, propertyName: string): Promise<string> {
  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  // Handle variable aliases first
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    // Check cache first!
    let aliasVariable = variableCache.get(value.id);

    if (!aliasVariable) {
      const aliasVariableFromFigma = await figma.variables.getVariableByIdAsync(value.id);

      if (!aliasVariableFromFigma) {
        throw new Error('Unexpected missing variable from Figma');
      }

      variableCache.set(value.id, aliasVariableFromFigma);
      aliasVariable = aliasVariableFromFigma;
    }

    return getVariableFallback(aliasVariable, propertyName);
  }

  switch (variable.resolvedType) {
    case 'FLOAT': {
      const numValue = value as number;
      return normalizeValue({
        propertyName,
        value: numValue,
      });
    }
    case 'COLOR': {
      if (typeof value === 'object' && 'r' in value) {
        const color = value as RGB | RGBA;
        const opacity = 'a' in color ? color.a : 1;
        return rgbaToString(color.r, color.g, color.b, opacity);
      }
      return '#000000';
    }
    case 'STRING':
      return value as string;
    default:
      return 'inherit';
  }
}

/**
 * Get VariableToken for a given variable ID and property. This function checks
 * the cache first, then fetches the variable from Figma if not cached.
 */
export async function collectBoundVariable(
  varId: string,
  property: string,
  path: SceneNode[],
  node: SceneNode,
): Promise<VariableToken | null> {
  // Check cache first
  let variable: Variable | null | undefined = variableCache.get(varId);

  if (!variable) {
    variable = await figma.variables.getVariableByIdAsync(varId);
    if (variable) {
      variableCache.set(varId, variable); // Cache it
    }
  }

  if (!variable) return null;

  const rawValue = await getVariableFallback(variable, property);
  const valueType = rawValue.includes('px') ? 'px' : null;

  return {
    type: 'variable',
    path,
    property,
    name: sanitizeName(variable.name),
    value: `$${sanitizeName(variable.name)}`,
    rawValue: rawValue.toLowerCase(),
    valueType: valueType,
    metadata: {
      figmaId: node.id,
      variableId: variable.id,
      variableName: variable.name,
    },
  };
}
