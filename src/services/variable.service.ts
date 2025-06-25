import { BaseToken, VariableToken } from '../types';
import { rgbaToString } from '../utils/color.utils';
import { sanitizeName } from '../utils/string.utils';
import { normalizeValue } from '../utils/value.utils';

const variableCache = new Map<string, any>();

async function getVariableFallback(
  variable: Variable | null,
  propertyName: string = '',
): Promise<string> {
  if (!variable) return '';

  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  // Handle variable aliases first
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    // Check cache first!
    let aliasVariable = variableCache.get(value.id);

    if (!aliasVariable) {
      aliasVariable = await figma.variables.getVariableByIdAsync(value.id);
      if (aliasVariable) {
        variableCache.set(value.id, aliasVariable);
      }
    }

    if (aliasVariable) {
      return getVariableFallback(aliasVariable, propertyName);
    }
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

export async function collectBoundVariable(
  varId: string,
  property: string,
  path: BaseToken['path'],
  node: SceneNode,
): Promise<VariableToken | null> {
  // Check cache first
  let variable = variableCache.get(varId);

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
