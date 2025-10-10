import { BaseToken, VariableToken, TokenCollection } from '../types';
import { rgbaToString, sanitizeName, normalizeValue } from '../utils';

const variableCache = new Map<string, Variable>();

async function getVariableFallback(variable: Variable, propertyName: string): Promise<string> {
  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
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
  path: BaseToken['path'],
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
      variableTokenType: 'semantic',
    },
  };
}

/**
 * Create a primitive variable token from a Figma Variable
 */
export async function createPrimitiveVariableToken(
  variable: Variable,
): Promise<VariableToken | null> {
  try {
    // Check ALL modes for aliases, not just the first one
    const allModeValues = Object.values(variable.valuesByMode);
    const hasAnyAlias = allModeValues.some(
      (value) =>
        value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS',
    );

    if (hasAnyAlias) {
      console.log(`🚫 Skipping alias variable: ${variable.name}`);
      return null;
    }

    // Get first mode value for processing
    const modeId = Object.keys(variable.valuesByMode)[0];
    const value = variable.valuesByMode[modeId];

    // Only collect primitive variables with direct values
    let rawValue: string;
    let property: string;

    switch (variable.resolvedType) {
      case 'COLOR':
        if (typeof value === 'object' && 'r' in value) {
          const color = value as RGB | RGBA;
          const opacity = 'a' in color ? color.a : 1;
          rawValue = rgbaToString(color.r, color.g, color.b, opacity);
          property = 'color';
        } else {
          return null;
        }
        break;
      case 'FLOAT':
        rawValue = normalizeValue({
          propertyName: 'spacing',
          value: value as number,
        });
        property = 'spacing';
        break;
      case 'STRING':
        rawValue = value as string;
        property = variable.name.toLowerCase().includes('font') ? 'font-family' : 'string';
        break;
      default:
        return null;
    }

    return {
      type: 'variable',
      path: [{ name: variable.name, type: 'FRAME' }],
      property,
      name: sanitizeName(variable.name),
      value: `$${sanitizeName(variable.name)}`,
      rawValue: rawValue.toLowerCase(),
      valueType: rawValue.includes('px') ? 'px' : null,
      metadata: {
        variableId: variable.id,
        variableName: variable.name,
        variableTokenType: 'primitive',
      },
    };
  } catch (error) {
    console.warn(`Failed to create token for variable ${variable.name}:`, error);
    return null;
  }
}

/**
 * Collect primitive Figma Variables (non-alias variables with direct values)
 */
export async function collectAllFigmaVariables(
  collection: TokenCollection,
  onProgress: (progress: number, message: string) => void,
) {
  try {
    onProgress(5, 'Collecting Figma Variables...');
    const primitiveTokens: VariableToken[] = [];

    // Get all variable collections
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();

    for (const varCollection of variableCollections) {
      onProgress(7, `Processing variable collection: ${varCollection.name}`);

      // Get all variables in this collection
      for (const variableId of varCollection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);

        if (variable) {
          // Create VariableToken for each primitive variable
          const token = await createPrimitiveVariableToken(variable);
          if (token) {
            primitiveTokens.push(token);
          }
        }
      }
    }

    console.log(`✨ Collected ${primitiveTokens.length} primitive variable tokens`);
    collection.tokens.push(...primitiveTokens);
  } catch (error) {
    console.warn('Failed to collect Figma Variables:', error);
  }
}
