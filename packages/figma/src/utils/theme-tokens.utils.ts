import { TokenCollection, VariableToken } from '../types';

export function generateThemeDirective(collection: TokenCollection): string {
  // Get variable tokens from the main tokens array
  const variableTokens = collection.tokens.filter((token) => token.type === 'variable');

  // Separate primitives and semantics
  const primitiveTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'primitive',
  );
  const semanticTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'semantic',
  );

  // Helper function to categorize and process tokens
  const processTokens = () => {
    return {
      colorTokens: new Map<string, string>(),
      spacingTokens: new Map<string, string>(),
      fontFamilyTokens: new Map<string, string>(),
      fontWeightTokens: new Map<string, string>(),
      fontSizeTokens: new Map<string, string>(),
      borderWidthTokens: new Map<string, string>(),
      borderRadiusTokens: new Map<string, string>(),
      lineHeightTokens: new Map<string, string>(),
      iconSizeTokens: new Map<string, string>(),
      screenSizeTokens: new Map<string, string>(),
      boxShadowTokens: new Map<string, string>(),
    };
  };

  // Process tokens and categorize them
  const processTokenCollection = (
    tokens: VariableToken[],
    collections: ReturnType<typeof processTokens>,
    isSemantic: boolean,
  ) => {
    for (const token of tokens) {
      let cleanName = token.name;
      let key: string;
      // Strip $ prefix from rawValue if present (for Tailwind output)
      let value = token.rawValue.startsWith('$') ? token.rawValue.slice(1) : token.rawValue;

      // For semantic tokens, rawValue contains the primitive variable name
      // We need to look up what category it belongs to and create a var() reference
      if (isSemantic) {
        // The primitive name is in value, we need to determine its category and create --css-var format
        value = convertPrimitiveNameToCssVarName(value);
      }

      // Determine the actual token type from the name, not just the property
      if (token.property === 'color' || cleanName.startsWith('colors-')) {
        cleanName = cleanName.replace(/^colors-/, '').replace(/^color-/, '');
        key = `--colors-${cleanName}`;
        collections.colorTokens.set(key, value);
      } else if (cleanName.includes('border-radius') || token.property === 'border-radius') {
        cleanName = cleanName.replace(/^.*border-radius-/, '').replace(/^border-radius-/, '');
        key = `--border-radius-${cleanName}`;
        collections.borderRadiusTokens.set(key, value);
      } else if (cleanName.includes('border-width') || token.property === 'border-width') {
        cleanName = cleanName.replace(/^.*border-width-/, '').replace(/^border-width-/, '');
        key = `--border-width-${cleanName}`;
        collections.borderWidthTokens.set(key, value);
      } else if (cleanName.includes('font-weight') || token.property === 'font-weight') {
        cleanName = cleanName.replace(/^.*font-weight-/, '').replace(/^font-weight-/, '');
        key = `--font-weight-${cleanName}`;
        collections.fontWeightTokens.set(key, value);
      } else if (cleanName.includes('font-size') || token.property === 'font-size') {
        cleanName = cleanName.replace(/^.*font-size-/, '').replace(/^font-size-/, '');
        key = `--font-size-${cleanName}`;
        collections.fontSizeTokens.set(key, value);
      } else if (cleanName.includes('font-family') || token.property === 'font-family') {
        cleanName = cleanName.replace(/^.*font-family-/, '').replace(/^font-family-/, '');
        if (cleanName.startsWith('font-')) {
          cleanName = cleanName.replace(/^font-/, '');
        }
        key = `--font-${cleanName}`;
        collections.fontFamilyTokens.set(key, value);
      } else if (cleanName.includes('font-leading') || cleanName.includes('line-height')) {
        cleanName = cleanName
          .replace(/^.*font-leading-/, '')
          .replace(/^.*line-height-/, '')
          .replace(/^font-leading-/, '')
          .replace(/^line-height-/, '');
        key = `--line-height-${cleanName}`;
        collections.lineHeightTokens.set(key, value);
      } else if (cleanName.includes('icon-size')) {
        cleanName = cleanName.replace(/^.*icon-size-/, '').replace(/^icon-size-/, '');
        key = `--icon-size-${cleanName}`;
        collections.iconSizeTokens.set(key, value);
      } else if (cleanName.includes('screen-size')) {
        cleanName = cleanName.replace(/^.*screen-size-/, '').replace(/^screen-size-/, '');
        key = `--screen-size-${cleanName}`;
        collections.screenSizeTokens.set(key, value);
      } else if (token.property === 'box-shadow') {
        cleanName = cleanName
          .replace(/^effect-/, '')
          .replace(/^shadow-/, '')
          .replace(/^box-shadow-/, '');
        key = `--${cleanName}`;
        collections.boxShadowTokens.set(key, value);
      } else if (token.property === 'spacing') {
        cleanName = cleanName.replace(/^spacing-/, '');
        key = `--spacing-${cleanName}`;
        collections.spacingTokens.set(key, value);
      }
    }
  };

  // Helper to convert primitive name to CSS variable name
  const convertPrimitiveNameToCssVarName = (primitiveName: string): string => {
    // This takes a primitive variable reference like "$color-blue-500"
    // and converts it to a var() reference like "var(--colors-blue-500)"
    // The primitiveName is already stripped of $ prefix

    if (primitiveName.includes('color') || primitiveName.includes('colour')) {
      // Remove color/colour prefix to avoid duplication
      const cleanedName = primitiveName
        .replace(/^colors-/, '')
        .replace(/^color-/, '')
        .replace(/^colours-/, '')
        .replace(/^colour-/, '');
      return `var(--colors-${cleanedName})`;
    } else if (primitiveName.includes('border-radius')) {
      const cleanedName = primitiveName
        .replace(/^.*border-radius-/, '')
        .replace(/^border-radius-/, '');
      return `var(--border-radius-${cleanedName})`;
    } else if (primitiveName.includes('border-width')) {
      const cleanedName = primitiveName
        .replace(/^.*border-width-/, '')
        .replace(/^border-width-/, '');
      return `var(--border-width-${cleanedName})`;
    } else if (primitiveName.includes('font-weight')) {
      const cleanedName = primitiveName.replace(/^.*font-weight-/, '').replace(/^font-weight-/, '');
      return `var(--font-weight-${cleanedName})`;
    } else if (primitiveName.includes('font-size')) {
      const cleanedName = primitiveName.replace(/^.*font-size-/, '').replace(/^font-size-/, '');
      return `var(--font-size-${cleanedName})`;
    } else if (
      primitiveName.includes('font') ||
      primitiveName.startsWith('inter') ||
      primitiveName.startsWith('roboto')
    ) {
      const cleanedName = primitiveName.replace(/^font-/, '');
      return `var(--font-${cleanedName})`;
    } else if (primitiveName.includes('line-height') || primitiveName.includes('font-leading')) {
      const cleanedName = primitiveName
        .replace(/^.*line-height-/, '')
        .replace(/^.*font-leading-/, '')
        .replace(/^line-height-/, '')
        .replace(/^font-leading-/, '');
      return `var(--line-height-${cleanedName})`;
    } else if (primitiveName.includes('icon-size')) {
      const cleanedName = primitiveName.replace(/^.*icon-size-/, '').replace(/^icon-size-/, '');
      return `var(--icon-size-${cleanedName})`;
    } else if (primitiveName.includes('screen-size')) {
      const cleanedName = primitiveName.replace(/^.*screen-size-/, '').replace(/^screen-size-/, '');
      return `var(--screen-size-${cleanedName})`;
    } else if (primitiveName.includes('shadow') || primitiveName.includes('effect')) {
      const cleanedName = primitiveName
        .replace(/^effect-/, '')
        .replace(/^shadow-/, '')
        .replace(/^box-shadow-/, '');
      return `var(--${cleanedName})`;
    } else if (primitiveName.includes('spacing')) {
      const cleanedName = primitiveName.replace(/^spacing-/, '');
      return `var(--spacing-${cleanedName})`;
    }
    return `var(--${primitiveName})`;
  };

  // Process primitives and semantics
  const primitiveCollections = processTokens();
  const semanticCollections = processTokens();
  processTokenCollection(primitiveTokens, primitiveCollections, false);
  processTokenCollection(semanticTokens, semanticCollections, true);

  // Helper to output a collection
  const outputCollection = (map: Map<string, string>) => {
    const sorted = Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
    let output = '';
    for (const [key, value] of sorted) {
      output += `  ${key}: ${value};\n`;
    }
    return output;
  };

  let result = '';

  // First, output :root with primitives ONLY (with actual values)
  const hasPrimitives = Object.values(primitiveCollections).some((map) => map.size > 0);

  if (hasPrimitives) {
    result += ':root {\n';
    // Output all primitives with actual values (NOT semantics)
    result += outputCollection(primitiveCollections.colorTokens);
    result += outputCollection(primitiveCollections.spacingTokens);
    result += outputCollection(primitiveCollections.fontFamilyTokens);
    result += outputCollection(primitiveCollections.fontWeightTokens);
    result += outputCollection(primitiveCollections.fontSizeTokens);
    result += outputCollection(primitiveCollections.borderWidthTokens);
    result += outputCollection(primitiveCollections.borderRadiusTokens);
    result += outputCollection(primitiveCollections.lineHeightTokens);
    result += outputCollection(primitiveCollections.iconSizeTokens);
    result += outputCollection(primitiveCollections.screenSizeTokens);
    result += outputCollection(primitiveCollections.boxShadowTokens);
    result += '}\n\n';
  }

  // Then, output @theme with simplified Tailwind naming convention
  // Maps simplified names (--color-*, --leading-*, etc.) to full CSS variable names
  result += '/* Generated Tailwind Theme */\n@theme {\n';

  // Helper to extract simplified name from full CSS variable name
  // e.g., "--colors-blue-100" → "color-blue-100"
  // e.g., "--line-height-lg" → "leading-lg"
  const extractSimplifiedName = (fullName: string): string => {
    // Remove the -- prefix
    const name = fullName.substring(2);

    if (name.startsWith('colors-')) {
      return name.replace('colors-', 'color-');
    } else if (name.startsWith('line-height-')) {
      return name.replace('line-height-', 'leading-');
    } else if (name.startsWith('border-radius-')) {
      return name.replace('border-radius-', 'radius-');
    } else if (name.startsWith('border-width-')) {
      return name.replace('border-width-', 'border-');
    } else if (name.startsWith('font-weight-')) {
      return name.replace('font-weight-', 'font-weight-');
    } else if (name.startsWith('font-size-')) {
      return name.replace('font-size-', 'font-size-');
    } else if (name.startsWith('font-')) {
      return name.replace('font-', 'font-');
    } else if (name.startsWith('spacing-')) {
      return name.replace('spacing-', 'spacing-');
    } else if (name.startsWith('icon-size-')) {
      return name.replace('icon-size-', 'icon-');
    } else if (name.startsWith('screen-size-')) {
      return name.replace('screen-size-', 'screen-');
    } else if (name.startsWith('shadow-') || name.startsWith('box-shadow-')) {
      return name.replace('box-shadow-', 'shadow-').replace('shadow-', 'shadow-');
    }
    return name;
  };

  // Helper to output theme collection with simplified names
  const outputThemeCollection = (map: Map<string, string>) => {
    const entries: Array<[string, string]> = [];
    for (const [key, value] of map.entries()) {
      const simplifiedKey = extractSimplifiedName(key);
      entries.push([`--${simplifiedKey}`, value]);
    }

    // Sort by simplified key name
    entries.sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );

    let output = '';
    for (const [simplifiedKey, value] of entries) {
      output += `  ${simplifiedKey}: ${value};\n`;
    }
    return output;
  };

  if (hasPrimitives) {
    // Output primitives with simplified names, referencing :root variables
    const outputPrimitiveTheme = (map: Map<string, string>) => {
      const entries: Array<[string, string]> = [];
      for (const [key] of map.entries()) {
        const simplifiedKey = extractSimplifiedName(key);
        entries.push([`--${simplifiedKey}`, `var(${key})`]);
      }

      entries.sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      );

      let output = '';
      for (const [simplifiedKey, value] of entries) {
        output += `  ${simplifiedKey}: ${value};\n`;
      }
      return output;
    };

    result += outputPrimitiveTheme(primitiveCollections.colorTokens);
    result += outputPrimitiveTheme(primitiveCollections.spacingTokens);
    result += outputPrimitiveTheme(primitiveCollections.fontFamilyTokens);
    result += outputPrimitiveTheme(primitiveCollections.fontWeightTokens);
    result += outputPrimitiveTheme(primitiveCollections.fontSizeTokens);
    result += outputPrimitiveTheme(primitiveCollections.borderWidthTokens);
    result += outputPrimitiveTheme(primitiveCollections.borderRadiusTokens);
    result += outputPrimitiveTheme(primitiveCollections.lineHeightTokens);
    result += outputPrimitiveTheme(primitiveCollections.iconSizeTokens);
    result += outputPrimitiveTheme(primitiveCollections.screenSizeTokens);
    result += outputPrimitiveTheme(primitiveCollections.boxShadowTokens);
  }

  if (Object.values(semanticCollections).some((map) => map.size > 0)) {
    // Output semantics with simplified names
    result += outputThemeCollection(semanticCollections.colorTokens);
    result += outputThemeCollection(semanticCollections.spacingTokens);
    result += outputThemeCollection(semanticCollections.fontFamilyTokens);
    result += outputThemeCollection(semanticCollections.fontWeightTokens);
    result += outputThemeCollection(semanticCollections.fontSizeTokens);
    result += outputThemeCollection(semanticCollections.borderWidthTokens);
    result += outputThemeCollection(semanticCollections.borderRadiusTokens);
    result += outputThemeCollection(semanticCollections.lineHeightTokens);
    result += outputThemeCollection(semanticCollections.iconSizeTokens);
    result += outputThemeCollection(semanticCollections.screenSizeTokens);
    result += outputThemeCollection(semanticCollections.boxShadowTokens);
  }

  result += '}\n';

  return result;
}

/**
 * Build dynamic theme mapping from variable tokens for use in generators
 */
export function buildDynamicThemeTokens(variableTokens: VariableToken[]) {
  // Initialize standard font weight mappings as fallback
  const standardFontWeights: Record<string, string> = {
    '100': 'thin',
    '200': 'extralight',
    '300': 'light',
    '400': 'normal',
    '500': 'medium',
    '600': 'semibold',
    '700': 'bold',
    '800': 'extrabold',
    '900': 'black',
  };

  const dynamicTheme = {
    spacing: {} as Record<string, string>,
    colors: {} as Record<string, string>,
    borderWidths: {} as Record<string, string>,
    borderRadius: {} as Record<string, string>,
    fontWeight: standardFontWeights,
    fontFamily: {} as Record<string, string[]>,
    fontSize: {} as Record<string, string>,
    lineHeight: {} as Record<string, string>,
    iconSize: {} as Record<string, string>,
    screenSize: {} as Record<string, string>,
    boxShadow: {} as Record<string, string>,
  };

  for (const token of variableTokens) {
    // Map rawValue to theme token name (matching themeTokens structure)
    let cleanName = token.name;
    // Strip $ prefix from rawValue if present (for variable references that might have it)
    const rawValueForMapping = token.rawValue.startsWith('$')
      ? token.rawValue.slice(1)
      : token.rawValue;

    // Determine the actual token type from the name, not just the property
    if (
      token.property === 'color' ||
      token.property.includes('color') ||
      cleanName.startsWith('colors-')
    ) {
      cleanName = cleanName.replace(/^colors-/, '').replace(/^color-/, '');
      // For colors, include the category prefix for dynamic theme mapping
      dynamicTheme.colors[rawValueForMapping] = `colors-${cleanName}`;
    } else if (cleanName.includes('border-radius') || token.property === 'border-radius') {
      // Border radius tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-radius-/, '').replace(/^border-radius-/, '');
      dynamicTheme.borderRadius[rawValueForMapping] = cleanName;
    } else if (cleanName.includes('border-width') || token.property === 'border-width') {
      // Border width tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-width-/, '').replace(/^border-width-/, '');
      dynamicTheme.borderWidths[rawValueForMapping] = cleanName;
    } else if (cleanName.includes('font-weight') || token.property === 'font-weight') {
      // Font weight tokens (even if categorized as font-family)
      cleanName = cleanName.replace(/^.*font-weight-/, '').replace(/^font-weight-/, '');

      // For font weights, we need to map both the clean name and raw value to a consistent target
      // Check if we already have a mapping for this numeric value in standard mappings
      const standardMapping =
        standardFontWeights[cleanName] || standardFontWeights[rawValueForMapping];
      const targetValue = standardMapping || cleanName;

      // Create bidirectional mapping for font weights
      // This allows both "medium" → "medium" and "500" → "medium" mappings

      // Map the clean name to the target value (e.g., "400" → "normal")
      dynamicTheme.fontWeight[cleanName] = targetValue;

      // Map the raw value to the target value (e.g., "regular" → "normal")
      dynamicTheme.fontWeight[rawValueForMapping] = targetValue;
    } else if (cleanName.includes('font-size') || token.property === 'font-size') {
      // Font size tokens
      cleanName = cleanName.replace(/^.*font-size-/, '').replace(/^font-size-/, '');
      dynamicTheme.fontSize[rawValueForMapping] = cleanName;
    } else if (cleanName.includes('font-family') || token.property === 'font-family') {
      // Font family tokens
      cleanName = cleanName.replace(/^.*font-family-/, '').replace(/^font-family-/, '');

      // Handle both 'font-family-*' and 'font-*' naming patterns
      if (cleanName.startsWith('font-')) {
        cleanName = cleanName.replace(/^font-/, '');
      }

      // Create bidirectional mapping for font families similar to font weights
      // The font family arrays should contain the actual font names

      // Map the clean name (theme key) to an array containing the raw value
      if (!dynamicTheme.fontFamily[cleanName]) {
        dynamicTheme.fontFamily[cleanName] = [];
      }

      // Add the rawValue to the array if it's not already there
      if (!dynamicTheme.fontFamily[cleanName].includes(rawValueForMapping)) {
        dynamicTheme.fontFamily[cleanName].push(rawValueForMapping);
      }
    } else if (cleanName.includes('font-leading') || cleanName.includes('line-height')) {
      // Line height tokens (often categorized as spacing in Figma)
      cleanName = cleanName
        .replace(/^.*font-leading-/, '')
        .replace(/^.*line-height-/, '')
        .replace(/^font-leading-/, '')
        .replace(/^line-height-/, '');
      dynamicTheme.lineHeight[rawValueForMapping] = cleanName;
    } else if (cleanName.includes('icon-size')) {
      // Icon size tokens (often categorized as spacing in Figma)
      cleanName = cleanName.replace(/^.*icon-size-/, '').replace(/^icon-size-/, '');
      dynamicTheme.iconSize[rawValueForMapping] = cleanName;
    } else if (cleanName.includes('screen-size')) {
      // Screen size tokens (often categorized as spacing in Figma)
      cleanName = cleanName.replace(/^.*screen-size-/, '').replace(/^screen-size-/, '');
      dynamicTheme.screenSize[rawValueForMapping] = cleanName;
    } else if (token.property === 'box-shadow') {
      // Box shadow tokens from effect styles
      cleanName = cleanName
        .replace(/^effect-/, '')
        .replace(/^shadow-/, '')
        .replace(/^box-shadow-/, '');
      dynamicTheme.boxShadow[rawValueForMapping] = cleanName;
    } else if (token.property === 'spacing') {
      // Pure spacing tokens only (not border, font, icon, or screen related)
      cleanName = cleanName.replace(/^spacing-/, '');
      dynamicTheme.spacing[rawValueForMapping] = cleanName;
    }
  }

  return dynamicTheme;
}
