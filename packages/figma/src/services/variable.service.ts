import { BaseToken, VariableToken, TokenCollection } from '../types';
import { rgbaToString, sanitizeName, normalizeValue } from '../utils';

const variableCache = new Map<string, Variable>();

/**
 * Resolves a variable to the name of the primitive variable it references (for semantic variables)
 * Returns the primitive variable name, not the resolved value
 */
async function resolveToPrimitiveVariableName(variable: Variable): Promise<string | null> {
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

    // Recursively resolve to the primitive
    const resolved = await resolveToPrimitiveVariableName(aliasVariable);
    if (resolved) {
      return resolved;
    }

    // If we reach here, this is a primitive (no more aliases)
    return sanitizeName(aliasVariable.name);
  }

  // We've reached a primitive variable
  return sanitizeName(variable.name);
}

/**
 * Helper to get the actual value from a variable (following alias chains)
 */
async function getVariableActualValue(variable: Variable, propertyName: string): Promise<string> {
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

    // Recursively resolve to the primitive's actual value
    return getVariableActualValue(aliasVariable, propertyName);
  }

  // We've reached a primitive variable, extract its actual value
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
      variableCache.set(varId, variable);
    }
  }

  if (!variable) return null;

  // Get the primitive variable name and actual value
  const primitiveVariableName = await resolveToPrimitiveVariableName(variable);
  if (!primitiveVariableName) return null;

  const rawValue = await getVariableActualValue(variable, property);
  const valueType = rawValue.includes('px') ? 'px' : null;

  return {
    type: 'variable',
    path,
    property,
    name: sanitizeName(variable.name),
    value: `$${sanitizeName(variable.name)}`,
    rawValue: rawValue.toLowerCase(),
    primitiveRef: primitiveVariableName,
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
    // Note: Alias check is now done in collectPrimitiveVariables, so we don't check again here
    // This function should only receive true primitives

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
      case 'FLOAT': {
        // Detect property type from variable name to ensure correct normalization
        // This matters because different property types normalize differently:
        // - opacity: 48 → 0.48 (unitless, 0-1 range)
        // - line-height: kept as is or converted to px if > 4
        // - font-weight: kept as is (unitless)
        // - dimensions (spacing, size, radius, etc.): 48 → 48px → 3rem
        const varNameLower = variable.name.toLowerCase();
        let propertyName = 'spacing'; // default for most FLOAT values

        if (varNameLower.includes('opacity')) {
          propertyName = 'opacity';
        } else if (varNameLower.includes('line') || varNameLower.includes('linespacing')) {
          propertyName = 'line-height';
        } else if (varNameLower.includes('font-weight') || varNameLower.includes('weight')) {
          propertyName = 'font-weight';
        }

        rawValue = normalizeValue({
          propertyName,
          value: value as number,
        });
        property = propertyName;
        break;
      }
      case 'STRING': {
        rawValue = value as string;
        property = variable.name.toLowerCase().includes('font') ? 'font-family' : 'string';
        break;
      }
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
 * Collect primitive variables from all Figma variable collections
 * Only collects TRUE primitives - variables that don't alias in any mode
 */
export async function collectPrimitiveVariables(
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
          // Skip any variables that are aliases in ANY mode
          const allModeValues = Object.values(variable.valuesByMode);
          const hasAnyAlias = allModeValues.some(
            (value) =>
              value &&
              typeof value === 'object' &&
              'type' in value &&
              value.type === 'VARIABLE_ALIAS',
          );

          if (hasAnyAlias) {
            console.log(
              `🚫 Skipping alias variable (won't be collected as primitive): ${variable.name}`,
            );
            continue;
          }

          // Create VariableToken for each true primitive variable
          const token = await createPrimitiveVariableToken(variable);
          if (token) {
            primitiveTokens.push(token);
          }
        }
      }
    }

    console.info(`✨ Collected ${primitiveTokens.length} primitive variable tokens`);
    collection.tokens.push(...primitiveTokens);
  } catch (error) {
    console.warn('Failed to collect Figma Variables:', error);
  }
}

/**
 * Collect semantic color variables for utility generation
 * Only collects color alias variables that match bg/text/border patterns
 */
export async function collectSemanticColorVariables(
  collection: TokenCollection,
  onProgress: (progress: number, message: string) => void,
) {
  try {
    onProgress(6, 'Collecting semantic color variables...');
    const semanticColorTokens: VariableToken[] = [];

    // Get all variable collections
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();

    for (const varCollection of variableCollections) {
      // Get all variables in this collection
      for (const variableId of varCollection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);

        if (!variable) continue;

        // Only collect COLOR variables that are aliases (semantic variables)
        if (variable.resolvedType !== 'COLOR') continue;

        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];

        // Skip if not an alias (must be a semantic/reference variable)
        if (
          !value ||
          typeof value !== 'object' ||
          !('type' in value) ||
          value.type !== 'VARIABLE_ALIAS'
        ) {
          continue;
        }

        // Filter by pattern: bg/background, text/foreground, border
        const varName = variable.name.toLowerCase();
        if (!/\/(bg|background|text|foreground|border)\//.test(varName)) {
          continue;
        }

        // Resolve to primitive variable name
        const primitiveVariableName = await resolveToPrimitiveVariableName(variable);
        if (!primitiveVariableName) continue;

        // Get the actual resolved color value
        const rawValue = await getVariableActualValue(variable, 'fills');

        // Create token with primitiveRef set
        const token: VariableToken = {
          type: 'variable',
          path: [], // No component path - standalone utility
          property: 'color', // COLOR type variable
          name: sanitizeName(variable.name),
          value: `$${sanitizeName(variable.name)}`,
          rawValue: rawValue.toLowerCase(),
          primitiveRef: primitiveVariableName,
          valueType: null,
          metadata: {
            figmaId: '', // No specific node association
            variableId: variable.id,
            variableName: variable.name,
            variableTokenType: 'semantic',
          },
        };

        semanticColorTokens.push(token);
      }
    }

    collection.tokens.push(...semanticColorTokens);
  } catch (error) {
    console.warn('Failed to collect semantic color variables:', error);
  }
}
