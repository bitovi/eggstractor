import { BaseToken, VariableToken, TokenCollection } from '../types';
import { rgbaToString, sanitizeName, normalizeValue, getModesFromCollection } from '../utils';

const variableCache = new Map<string, Variable>();

/**
 * Infer property name from variable name for FLOAT variables
 * This helps normalizeValue apply the correct formatting
 */
function inferPropertyFromVariableName(variableName: string): string {
  const lowerName = variableName.toLowerCase();

  if (lowerName.includes('opacity')) return 'opacity';
  if (lowerName.includes('line') || lowerName.includes('linespacing')) return 'line-height';
  if (lowerName.includes('font-weight') || lowerName.includes('weight')) return 'font-weight';
  if (lowerName.includes('font') && !lowerName.includes('size')) return 'font-family';

  // Default to spacing for most numeric values (border-radius, padding, margin, etc.)
  return 'spacing';
}

/**
 * Resolves a variable to the name of the primitive variable it references (for semantic variables)
 * Returns the primitive variable name, not the resolved value
 */
async function resolveToPrimitiveVariableName(variable: Variable): Promise<string | null> {
  // Get the first mode ID (sorted for deterministic ordering across different Figma files)
  const modeId = Object.keys(variable.valuesByMode).sort()[0];
  const value = variable.valuesByMode[modeId];

  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    let aliasVariable = variableCache.get(value.id);

    if (!aliasVariable) {
      const aliasVariableFromFigma = await figma.variables.getVariableByIdAsync(value.id);

      if (!aliasVariableFromFigma) {
        // TODO(ERROR-HANDLING): Replace throw with log-and-continue strategy.
        // Should log warning with variable ID (value.id), use fallback value or skip the token,
        // and add to warnings array to show in UI. Don't halt entire process.
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
  // Get the first mode ID (sorted for deterministic ordering across different Figma files)
  const modeId = Object.keys(variable.valuesByMode).sort()[0];
  const value = variable.valuesByMode[modeId];

  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    let aliasVariable = variableCache.get(value.id);

    if (!aliasVariable) {
      const aliasVariableFromFigma = await figma.variables.getVariableByIdAsync(value.id);

      if (!aliasVariableFromFigma) {
        // TODO(ERROR-HANDLING): Replace throw with log-and-continue strategy.
        // Should log warning with variable ID (value.id), use fallback value or skip the token,
        // and add to warnings array to show in UI. Don't halt entire process.
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
 *
 * Note: This currently uses the first mode (default mode) when resolving values.
 * In the future, this could be extended to accept a mode context parameter
 * to support mode-aware component token generation.
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

  // Get the primitive variable name and actual value (using first/default mode)
  const primitiveVariableName = await resolveToPrimitiveVariableName(variable);
  if (!primitiveVariableName) return null;

  const rawValue = await getVariableActualValue(variable, property);
  const valueType = rawValue.includes('px') ? 'px' : null;

  // TODO: Consider collecting mode-specific values here as well
  // For now, we use the default mode for bound variables
  // Return StandardVariableToken since we don't track multiple modes for bound variables
  return {
    type: 'variable',
    path,
    property,
    name: sanitizeName(variable.name),
    value: sanitizeName(variable.name),
    rawValue: rawValue.toLowerCase(),
    primitiveRef: primitiveVariableName,
    valueType: valueType,
    metadata: {
      figmaId: node.id,
      variableId: variable.id,
      variableName: variable.name,
      variableTokenType: 'semantic',
    },
  } as const;
}

/**
 * Create a primitive variable token from a Figma Variable
 * Now supports multiple modes - collects values for all modes in the variable
 */
export async function createPrimitiveVariableToken(
  variable: Variable,
  collection: VariableCollection,
): Promise<VariableToken | null> {
  try {
    // Note: Alias check is now done in collectPrimitiveVariables, so we don't check again here
    // This function should only receive true primitives

    const modes = getModesFromCollection(collection);

    // If collection has no modes (e.g., in tests), use first mode from valuesByMode
    if (modes.length === 0) {
      const modeIds = Object.keys(variable.valuesByMode).sort();
      if (modeIds.length === 0) {
        console.warn(`Variable ${variable.name} has no modes`);
        return null;
      }

      // Create a default mode from the first mode ID (sorted for deterministic ordering)
      modes.push({
        modeId: modeIds[0],
        modeName: 'default',
        sanitizedName: 'default',
      });
    }

    const defaultMode = modes[0];

    // Get default mode value for the primary rawValue
    const defaultModeValue = variable.valuesByMode[defaultMode.modeId];

    // Only collect primitive variables with direct values
    let rawValue: string;
    let property: string;
    const modeValues: Record<string, string> = {};

    // Process all modes and collect their values
    for (const mode of modes) {
      const value = variable.valuesByMode[mode.modeId];
      if (!value) continue;

      let modeRawValue: string;

      switch (variable.resolvedType) {
        case 'COLOR':
          if (typeof value === 'object' && 'r' in value) {
            const color = value as RGB | RGBA;
            const opacity = 'a' in color ? color.a : 1;
            modeRawValue = rgbaToString(color.r, color.g, color.b, opacity);
          } else {
            continue;
          }
          break;
        case 'FLOAT': {
          const propertyName = inferPropertyFromVariableName(variable.name);
          modeRawValue = normalizeValue({
            propertyName,
            value: value as number,
          });
          break;
        }
        case 'STRING': {
          modeRawValue = value as string;
          break;
        }
        default:
          continue;
      }

      modeValues[mode.modeId] = modeRawValue.toLowerCase();
    }

    // Set the primary property and rawValue from the default mode
    switch (variable.resolvedType) {
      case 'COLOR':
        if (typeof defaultModeValue === 'object' && 'r' in defaultModeValue) {
          const color = defaultModeValue as RGB | RGBA;
          const opacity = 'a' in color ? color.a : 1;
          rawValue = rgbaToString(color.r, color.g, color.b, opacity);
          property = 'color';
        } else {
          return null;
        }
        break;
      case 'FLOAT': {
        const propertyName = inferPropertyFromVariableName(variable.name);
        rawValue = normalizeValue({
          propertyName,
          value: Number(defaultModeValue),
        });
        property = propertyName;
        break;
      }
      case 'STRING': {
        rawValue = String(defaultModeValue);
        property = variable.name.toLowerCase().includes('font') ? 'font-family' : 'string';
        break;
      }
      default:
        return null;
    }

    // Return ModeVariableToken if multiple modes, otherwise StandardVariableToken
    const hasMultipleModes = Object.keys(modeValues).length > 1;

    if (hasMultipleModes) {
      return {
        type: 'variable',
        path: [{ name: variable.name, type: 'FRAME' }],
        property,
        name: sanitizeName(variable.name),
        value: sanitizeName(variable.name),
        rawValue: rawValue.toLowerCase(),
        valueType: rawValue.includes('px') ? 'px' : null,
        modeId: defaultMode.modeId,
        modeName: defaultMode.modeName,
        modes: Object.keys(modeValues).sort(),
        modeValues: modeValues,
        metadata: {
          variableId: variable.id,
          variableName: variable.name,
          variableTokenType: 'primitive',
        },
      } as const;
    } else {
      // Single mode - return StandardVariableToken
      return {
        type: 'variable',
        path: [{ name: variable.name, type: 'FRAME' }],
        property,
        name: sanitizeName(variable.name),
        value: sanitizeName(variable.name),
        rawValue: rawValue.toLowerCase(),
        valueType: rawValue.includes('px') ? 'px' : null,
        metadata: {
          variableId: variable.id,
          variableName: variable.name,
          variableTokenType: 'primitive',
        },
      } as const;
    }
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

    // Initialize modes map if not already present
    if (!collection.modes) {
      collection.modes = new Map<string, string>();
    }

    // Get all variable collections
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();

    for (const varCollection of variableCollections) {
      onProgress(7, `Processing variable collection: ${varCollection.name}`);

      // Skip typography/line-height collections - we don't support typography modes yet
      if (varCollection.name.toLowerCase().includes('typography')) {
        continue;
      }

      // Collect mode information from this collection
      const modes = getModesFromCollection(varCollection);
      for (const mode of modes) {
        collection.modes.set(mode.modeId, mode.sanitizedName);
      }

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
          // Pass the varCollection so we can extract mode information
          const token = await createPrimitiveVariableToken(variable, varCollection);
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
 * Now supports multiple modes - creates tokens for each mode
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
      const modes = getModesFromCollection(varCollection);

      // If collection has no modes (e.g., in tests), use first mode from a variable
      if (modes.length === 0) {
        // Try to get mode from first variable in collection
        if (varCollection.variableIds.length > 0) {
          const firstVar = await figma.variables.getVariableByIdAsync(varCollection.variableIds[0]);
          if (firstVar) {
            const modeIds = Object.keys(firstVar.valuesByMode).sort();
            if (modeIds.length > 0) {
              modes.push({
                modeId: modeIds[0],
                modeName: 'default',
                sanitizedName: 'default',
              });
            }
          }
        }

        // If still no modes, skip this collection
        if (modes.length === 0) {
          continue;
        }
      }

      const defaultMode = modes[0];

      // Get all variables in this collection
      for (const variableId of varCollection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);

        if (!variable) continue;

        // Only collect COLOR variables that are aliases (semantic variables)
        if (variable.resolvedType !== 'COLOR') continue;

        // Check if this is an alias variable - must be alias in at least the default mode
        const defaultValue = variable.valuesByMode[defaultMode.modeId];

        // Skip if not an alias (must be a semantic/reference variable)
        if (
          !defaultValue ||
          typeof defaultValue !== 'object' ||
          !('type' in defaultValue) ||
          defaultValue.type !== 'VARIABLE_ALIAS'
        ) {
          continue;
        }

        // Filter by pattern: bg/background, text/foreground, border
        const varName = variable.name.toLowerCase();
        if (!/\/(bg|background|text|foreground|border)\//.test(varName)) {
          continue;
        }

        // Collect mode-specific values
        const modeValues: Record<string, string> = {};
        const modePrimitiveRefs: Record<string, string> = {};

        for (const mode of modes) {
          const modeValue = variable.valuesByMode[mode.modeId];

          // Skip if this mode doesn't have a value or isn't an alias
          if (
            !modeValue ||
            typeof modeValue !== 'object' ||
            !('type' in modeValue) ||
            modeValue.type !== 'VARIABLE_ALIAS'
          ) {
            continue;
          }
          // Resolve to primitive variable name for this mode
          // Note: We need to get the aliased variable for this specific mode
          const aliasedVariableId = modeValue.id;
          const aliasedVariable = await figma.variables.getVariableByIdAsync(aliasedVariableId);

          if (aliasedVariable) {
            const primitiveRef = sanitizeName(aliasedVariable.name);
            modePrimitiveRefs[mode.modeId] = primitiveRef;

            // Get the actual resolved color value for this mode
            const actualValue = await getVariableActualValue(variable, 'fills');
            modeValues[mode.modeId] = actualValue.toLowerCase();
          }
        }

        // Resolve to primitive variable name (for default mode - backward compatibility)
        const primitiveVariableName = await resolveToPrimitiveVariableName(variable);
        if (!primitiveVariableName) continue;

        // Get the actual resolved color value for default mode
        const rawValue = await getVariableActualValue(variable, 'fills');

        // Create token - use ModeVariableToken if multiple modes, otherwise StandardVariableToken
        const hasMultipleModes = Object.keys(modeValues).length > 1;
        const token: VariableToken = hasMultipleModes
          ? ({
              type: 'variable',
              path: [], // No component path - standalone utility
              property: 'color', // COLOR type variable
              name: sanitizeName(variable.name),
              value: sanitizeName(variable.name),
              rawValue: rawValue.toLowerCase(),
              primitiveRef: primitiveVariableName,
              valueType: null,
              modeId: defaultMode.modeId,
              modeName: defaultMode.modeName,
              modes: Object.keys(modeValues).sort(),
              modeValues: modeValues,
              modePrimitiveRefs: modePrimitiveRefs,
              metadata: {
                variableId: variable.id,
                variableName: variable.name,
                variableTokenType: 'semantic',
              },
            } as const)
          : ({
              type: 'variable',
              path: [], // No component path - standalone utility
              property: 'color', // COLOR type variable
              name: sanitizeName(variable.name),
              value: sanitizeName(variable.name),
              rawValue: rawValue.toLowerCase(),
              primitiveRef: primitiveVariableName,
              valueType: null,
              metadata: {
                variableId: variable.id,
                variableName: variable.name,
                variableTokenType: 'semantic',
              },
            } as const);

        semanticColorTokens.push(token);
      }
    }

    collection.tokens.push(...semanticColorTokens);
  } catch (error) {
    console.warn('Failed to collect semantic color variables:', error);
  }
}
