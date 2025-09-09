import { TokenCollection, VariableToken } from '../types';

export function generateThemeDirective(collection: TokenCollection): string {
  let themeOutput = '/* Generated Tailwind Theme */\n@theme {\n';

  // Get variable tokens from the main tokens array
  const variableTokens = collection.tokens.filter((token) => token.type === 'variable');

  // Filter to only primitive tokens for @theme directive
  const primitiveTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'primitive',
  );

  // Separate collections for different token types (primitives only)
  const colorTokens = new Map<string, string>();
  const spacingTokens = new Map<string, string>();
  const fontFamilyTokens = new Map<string, string>();
  const fontWeightTokens = new Map<string, string>();
  const fontSizeTokens = new Map<string, string>();
  const borderWidthTokens = new Map<string, string>();
  const borderRadiusTokens = new Map<string, string>();
  const lineHeightTokens = new Map<string, string>();
  const iconSizeTokens = new Map<string, string>();
  const screenSizeTokens = new Map<string, string>();
  const boxShadowTokens = new Map<string, string>();

  // Process only primitive tokens
  for (const token of primitiveTokens) {
    let cleanName = token.name;
    let key: string;

    // Determine the actual token type from the name, not just the property
    if (token.property === 'color' || cleanName.startsWith('colors-')) {
      // Only pure color tokens
      cleanName = cleanName.replace(/^colors-/, '').replace(/^color-/, '');
      key = `--colors-${cleanName}`;
      colorTokens.set(key, token.rawValue);
    } else if (cleanName.includes('border-radius') || token.property === 'border-radius') {
      // Border radius tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-radius-/, '').replace(/^border-radius-/, '');
      key = `--border-radius-${cleanName}`;
      borderRadiusTokens.set(key, token.rawValue);
    } else if (cleanName.includes('border-width') || token.property === 'border-width') {
      // Border width tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-width-/, '').replace(/^border-width-/, '');
      key = `--border-width-${cleanName}`;
      borderWidthTokens.set(key, token.rawValue);
    } else if (cleanName.includes('font-weight') || token.property === 'font-weight') {
      // Font weight tokens (even if categorized as font-family)
      cleanName = cleanName.replace(/^.*font-weight-/, '').replace(/^font-weight-/, '');
      key = `--font-weight-${cleanName}`;
      fontWeightTokens.set(key, token.rawValue);
    } else if (cleanName.includes('font-size') || token.property === 'font-size') {
      // Font size tokens
      cleanName = cleanName.replace(/^.*font-size-/, '').replace(/^font-size-/, '');
      key = `--font-size-${cleanName}`;
      fontSizeTokens.set(key, token.rawValue);
    } else if (cleanName.includes('font-family') || token.property === 'font-family') {
      // Font family tokens
      cleanName = cleanName.replace(/^.*font-family-/, '').replace(/^font-family-/, '');
      key = `--font-${cleanName}`;
      fontFamilyTokens.set(key, token.rawValue);
    } else if (cleanName.includes('font-leading') || cleanName.includes('line-height')) {
      // Line height tokens (often categorized as spacing in Figma)
      cleanName = cleanName
        .replace(/^.*font-leading-/, '')
        .replace(/^.*line-height-/, '')
        .replace(/^font-leading-/, '')
        .replace(/^line-height-/, '');
      key = `--line-height-${cleanName}`;
      lineHeightTokens.set(key, token.rawValue);
    } else if (cleanName.includes('icon-size')) {
      // Icon size tokens (often categorized as spacing in Figma)
      cleanName = cleanName.replace(/^.*icon-size-/, '').replace(/^icon-size-/, '');
      key = `--icon-size-${cleanName}`;
      iconSizeTokens.set(key, token.rawValue);
    } else if (cleanName.includes('screen-size')) {
      // Screen size tokens (often categorized as spacing in Figma)
      cleanName = cleanName.replace(/^.*screen-size-/, '').replace(/^screen-size-/, '');
      key = `--screen-size-${cleanName}`;
      screenSizeTokens.set(key, token.rawValue);
    } else if (token.property === 'box-shadow') {
      // Box shadow tokens from effect styles
      cleanName = cleanName.replace(/^effect-/, '').replace(/^shadow-/, '').replace(/^box-shadow-/, '');
      key = `--${cleanName}`;
      boxShadowTokens.set(key, token.rawValue);
    } else if (token.property === 'spacing') {
      // Pure spacing tokens only (not border, font, icon, or screen related)
      cleanName = cleanName.replace(/^spacing-/, '');
      key = `--spacing-${cleanName}`;
      spacingTokens.set(key, token.rawValue);
    }
    // Skip composite tokens like background-color, fills, etc.
  }

  // Output tokens in organized groups with natural sorting
  const sortedColorEntries = Array.from(colorTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedColorEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedSpacingEntries = Array.from(spacingTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedSpacingEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedBorderWidthEntries = Array.from(borderWidthTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedBorderWidthEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedBorderRadiusEntries = Array.from(borderRadiusTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedBorderRadiusEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedFontFamilyEntries = Array.from(fontFamilyTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedFontFamilyEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedFontWeightEntries = Array.from(fontWeightTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedFontWeightEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedFontSizeEntries = Array.from(fontSizeTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedFontSizeEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedLineHeightEntries = Array.from(lineHeightTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedLineHeightEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedIconSizeEntries = Array.from(iconSizeTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedIconSizeEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedScreenSizeEntries = Array.from(screenSizeTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedScreenSizeEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  const sortedBoxShadowEntries = Array.from(boxShadowTokens.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );
  for (const [key, value] of sortedBoxShadowEntries) {
    themeOutput += `  ${key}: ${value};\n`;
  }

  themeOutput += '}\n';
  return themeOutput;
}

/**
 * Build dynamic theme mapping from variable tokens for use in generators
 */
export function buildDynamicThemeTokens(variableTokens: VariableToken[]) {
  const dynamicTheme = {
    spacing: {} as Record<string, string>,
    colors: {} as Record<string, string>,
    borderWidths: {} as Record<string, string>,
    borderRadius: {} as Record<string, string>,
    fontWeight: {} as Record<string, string>,
    fontFamily: {} as Record<string, string[]>,
    fontSize: {} as Record<string, string>,
    lineHeight: {} as Record<string, string>,
    iconSize: {} as Record<string, string>,
    screenSize: {} as Record<string, string>,
    boxShadow: {} as Record<string, string>,
  };

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

  // Start with standard mappings
  Object.assign(dynamicTheme.fontWeight, standardFontWeights);

  for (const token of variableTokens) {
    // Map rawValue to theme token name (matching themeTokens structure)
    let cleanName = token.name;

    // Determine the actual token type from the name, not just the property
    if (
      token.property === 'color' ||
      token.property.includes('color') ||
      cleanName.startsWith('colors-')
    ) {
      cleanName = cleanName.replace(/^colors-/, '').replace(/^color-/, '');
      dynamicTheme.colors[token.rawValue] = `colors-${cleanName}`;
    } else if (cleanName.includes('border-radius') || token.property === 'border-radius') {
      // Border radius tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-radius-/, '').replace(/^border-radius-/, '');
      dynamicTheme.borderRadius[token.rawValue] = cleanName;
    } else if (cleanName.includes('border-width') || token.property === 'border-width') {
      // Border width tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-width-/, '').replace(/^border-width-/, '');
      dynamicTheme.borderWidths[token.rawValue] = cleanName;
    } else if (cleanName.includes('font-weight') || token.property === 'font-weight') {
      // Font weight tokens (even if categorized as font-family)
      cleanName = cleanName.replace(/^.*font-weight-/, '').replace(/^font-weight-/, '');

      // For font weights, we need to map both the clean name and raw value to a consistent target
      // Check if we already have a mapping for this numeric value in standard mappings
      const standardMapping = standardFontWeights[cleanName] || standardFontWeights[token.rawValue];
      const targetValue = standardMapping || cleanName;

      // Create bidirectional mapping for font weights
      // This allows both "medium" → "medium" and "500" → "medium" mappings

      // Map the clean name to the target value (e.g., "400" → "normal")
      dynamicTheme.fontWeight[cleanName] = targetValue;

      // Map the raw value to the target value (e.g., "regular" → "normal")
      dynamicTheme.fontWeight[token.rawValue] = targetValue;
    } else if (cleanName.includes('font-size') || token.property === 'font-size') {
      // Font size tokens
      cleanName = cleanName.replace(/^.*font-size-/, '').replace(/^font-size-/, '');
      dynamicTheme.fontSize[token.rawValue] = cleanName;
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
      if (!dynamicTheme.fontFamily[cleanName].includes(token.rawValue)) {
        dynamicTheme.fontFamily[cleanName].push(token.rawValue);
      }
    } else if (cleanName.includes('font-leading') || cleanName.includes('line-height')) {
      // Line height tokens (often categorized as spacing in Figma)
      cleanName = cleanName
        .replace(/^.*font-leading-/, '')
        .replace(/^.*line-height-/, '')
        .replace(/^font-leading-/, '')
        .replace(/^line-height-/, '');
      dynamicTheme.lineHeight[token.rawValue] = cleanName;
    } else if (cleanName.includes('icon-size')) {
      // Icon size tokens (often categorized as spacing in Figma)
      cleanName = cleanName.replace(/^.*icon-size-/, '').replace(/^icon-size-/, '');
      dynamicTheme.iconSize[token.rawValue] = cleanName;
    } else if (cleanName.includes('screen-size')) {
      // Screen size tokens (often categorized as spacing in Figma)
      cleanName = cleanName.replace(/^.*screen-size-/, '').replace(/^screen-size-/, '');
      dynamicTheme.screenSize[token.rawValue] = cleanName;
    } else if (token.property === 'box-shadow') {
      // Box shadow tokens from effect styles
      cleanName = cleanName.replace(/^effect-/, '').replace(/^shadow-/, '').replace(/^box-shadow-/, '');
      dynamicTheme.boxShadow[token.rawValue] = cleanName;
    } else if (token.property === 'spacing') {
      // Pure spacing tokens only (not border, font, icon, or screen related)
      cleanName = cleanName.replace(/^spacing-/, '');
      dynamicTheme.spacing[token.rawValue] = cleanName;
    }
  }

  return dynamicTheme;
}
