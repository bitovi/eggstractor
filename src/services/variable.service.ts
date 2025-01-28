import { rgbaToString } from '../utils/color.utils';

export async function getVariableFallback(variable: Variable | null, propertyName: string = ''): Promise<string> {
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
      return shouldHaveUnits(propertyName, numValue) ? `${numValue}px` : String(numValue);
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

function shouldHaveUnits(propertyName: string, value: number): boolean {
  const unitlessProperties = ['font-weight', 'opacity'];
  const propertyLower = propertyName.toLowerCase();
  
  if (unitlessProperties.some(prop => propertyLower.includes(prop))) {
    return false;
  }
  if (propertyLower.includes('line-height')) {
    return value > 4;
  }
  
  return true;
} 