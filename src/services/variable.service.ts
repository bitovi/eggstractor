import { VariableToken } from '../types';
import { rgbaToString } from '../utils/color.utils';
import { normalizeValue } from '../utils/value.utils';

async function getVariableFallback(variable: Variable | null, propertyName: string = ''): Promise<string> {
  if (!variable) return '';

  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  // Handle variable aliases first
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasVariable = await figma.variables.getVariableByIdAsync(value.id);
    if (aliasVariable) {
      return getVariableFallback(aliasVariable, propertyName);
    }
  }

  switch (variable.resolvedType) {
    case "FLOAT": {
      const numValue = value as number;
      return normalizeValue({ 
        propertyName, 
        value: numValue 
      });
    }
    case "COLOR": {
      if (typeof value === 'object' && 'r' in value) {
        const color = value as RGB | RGBA;
        const opacity = 'a' in color ? color.a : 1;
        return rgbaToString(color.r, color.g, color.b, opacity);
      }
      return '#000000';
    }
    case "STRING":
      return value as string;
    default:
      return "inherit";
  }
}

export async function collectBoundVariable(varId: string, property: string, path: string[], node: SceneNode): Promise<VariableToken | null> {
  const variable = await figma.variables.getVariableByIdAsync(varId);
  if (!variable) return null;
  const rawValue = await getVariableFallback(variable, property);
  const valueType = rawValue.includes('px') ? 'px' : null;

  return {
    type: 'variable',
    path,
    property,
    name: variable.name,
    value: `$${variable.name}`,
    rawValue: rawValue.toLowerCase(),
    valueType: valueType,
    metadata: {
      figmaId: node.id,
      variableId: variable.id,
      variableName: variable.name,
    }
  };
}
