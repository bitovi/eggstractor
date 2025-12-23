import { TokenCollection, VariableToken, ModeVariableToken } from '../types';
import { normalizeModeName } from './mode.utils';

/**
 * Type guard to check if a VariableToken is a ModeVariableToken
 */
function isModeVariableToken(token: VariableToken): token is ModeVariableToken {
  return 'modeId' in token && 'modes' in token && 'modeValues' in token;
}

/**
 * Extract unique mode information from tokens
 * Returns a map of modeId -> sanitized mode name
 */
function extractModesFromTokens(tokens: VariableToken[]): Map<string, string> {
  const modesMap = new Map<string, string>();

  for (const token of tokens) {
    if (isModeVariableToken(token)) {
      // This token has multiple modes - add all of them
      if (!modesMap.has(token.modeId)) {
        modesMap.set(token.modeId, normalizeModeName(token.modeName));
      }
      // Also add any other modes from the modes array
      for (const modeId of token.modes) {
        if (!modesMap.has(modeId)) {
          // For non-primary modes, we only have the ID
          modesMap.set(modeId, `mode-${modeId}`);
        }
      }
    }
  }

  return modesMap;
}

/**
 * Filter out typography-only modes (e.g., line-height variations).
 * Returns only modes that modify color or non-typography tokens.
 *
 * Typography-only modes are those that only vary font-related properties:
 * - font-family
 * - font-weight
 * - font-size
 * - line-height (font-leading)
 *
 * @param modesMap - Map of all modes
 * @param tokens - All variable tokens
 * @returns Filtered map containing only non-typography modes
 */
function filterTypographyOnlyModes(
  modesMap: Map<string, string>,
  tokens: VariableToken[],
): Map<string, string> {
  if (modesMap.size <= 1) {
    return modesMap; // No filtering needed for single mode
  }

  // Analyze each mode to see what types of tokens it modifies
  const modeTokenTypes = new Map<string, Set<string>>();

  for (const token of tokens) {
    if (!isModeVariableToken(token)) continue;

    // Check all modes for this token
    for (const modeId of token.modes) {
      if (!modeTokenTypes.has(modeId)) {
        modeTokenTypes.set(modeId, new Set());
      }

      // Categorize token by its property type
      const tokenCategory = categorizeTokenProperty(token);
      const tokenTypesSet = modeTokenTypes.get(modeId);
      if (tokenTypesSet) {
        tokenTypesSet.add(tokenCategory);
      }
    }
  }

  // Filter out modes that ONLY have typography tokens
  const filteredModes = new Map<string, string>();

  for (const [modeId, modeName] of modesMap.entries()) {
    const tokenTypes = modeTokenTypes.get(modeId);

    if (!tokenTypes) {
      // No tokens for this mode, keep it
      filteredModes.set(modeId, modeName);
      continue;
    }

    // Check if this mode has any non-typography tokens
    const hasNonTypography = Array.from(tokenTypes).some((category) => category !== 'typography');

    if (hasNonTypography) {
      filteredModes.set(modeId, modeName);
    }
    // else: Skip typography-only modes
  }

  return filteredModes;
}

/**
 * Categorize a token's property into broad categories
 */
function categorizeTokenProperty(token: VariableToken): string {
  const { property, name } = token;
  const lowerName = name.toLowerCase();
  const lowerProp = property.toLowerCase();

  // Typography-related tokens
  if (
    lowerProp.includes('font') ||
    lowerProp.includes('line-height') ||
    lowerName.includes('font-family') ||
    lowerName.includes('font-weight') ||
    lowerName.includes('font-size') ||
    lowerName.includes('font-leading') ||
    lowerName.includes('line-height')
  ) {
    return 'typography';
  }

  // Color tokens
  if (lowerProp === 'color' || lowerName.includes('color') || lowerName.includes('colour')) {
    return 'color';
  }

  // Everything else (spacing, borders, shadows, etc.)
  return 'other';
}

export function generateThemeDirective(
  collection: TokenCollection,
  excludeSemanticColorsFromTheme = false,
): string {
  // Get variable tokens from the main tokens array
  const variableTokens = collection.tokens.filter((token) => token.type === 'variable');

  // Separate primitives and semantics
  const primitiveTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'primitive',
  );
  const semanticTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'semantic',
  );

  // Separate standalone semantic colors (for utilities) from bound semantics (for components)
  const standaloneSemanticColors = semanticTokens.filter(
    (token) => token.path.length === 0 && token.property === 'color',
  );
  const standaloneSemanticNonColors = semanticTokens.filter(
    (token) => token.path.length === 0 && token.property !== 'color',
  );
  const boundSemanticTokens = semanticTokens.filter((token) => token.path.length > 0);

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
  ) => {
    for (const token of tokens) {
      let cleanName = token.name;
      let key: string;
      // For semantic tokens, use primitiveRef for category detection
      // For primitives, use rawValue directly
      let value = token.rawValue;

      if (token.primitiveRef) {
        // The primitive name is in primitiveRef, use it to determine category and create --css-var format
        value = convertPrimitiveNameToCssVarName(token.primitiveRef);
      } else if (value.startsWith('$')) {
        // Strip $ prefix from rawValue if present (for Tailwind output)
        value = value.slice(1);
      }

      // Determine the actual token type from the name, not just the property
      if (token.property === 'color' || cleanName.startsWith('colors-')) {
        cleanName = cleanName.replace(/^colors-/, '').replace(/^color-/, '');
        // For semantic tokens (those with primitiveRef), don't add the --color- prefix
        // For primitive tokens, keep the --color- prefix
        if (token.primitiveRef) {
          key = `--${cleanName}`; // Semantic: --action-bg
        } else {
          key = `--color-${cleanName}`; // Primitive: --color-base-blue-500
        }
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
    // This takes a primitive variable name like "base-font-family-inter"
    // and converts it to a var() reference like "var(--font-inter)"

    if (primitiveName.includes('color') || primitiveName.includes('colour')) {
      // Remove color/colour prefix to avoid duplication
      const cleanedName = primitiveName
        .replace(/^colors-/, '')
        .replace(/^color-/, '')
        .replace(/^colours-/, '')
        .replace(/^colour-/, '');
      return `var(--color-${cleanedName})`;
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
    } else if (primitiveName.includes('font-family') || primitiveName.includes('font-')) {
      // For font family, extract just the font name (e.g., "inter", "roboto")
      // From "base-font-family-inter" -> "inter"
      // From "base-font-inter" -> "inter"
      const cleanedName = primitiveName
        .replace(/^.*font-family-/, '')
        .replace(/^.*font-/, '')
        .replace(/^font-family-/, '')
        .replace(/^font-/, '');
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
    } else if (primitiveName.includes('spacing') || primitiveName.includes('size')) {
      // For spacing/size tokens, ensure they have the spacing prefix
      // e.g., "base-size-2xs" -> "spacing-base-size-2xs"
      const cleanedName = primitiveName.replace(/^spacing-/, '');
      return `var(--spacing-${cleanedName})`;
    }
    return `var(--${primitiveName})`;
  };

  // Process primitives and semantics
  const primitiveCollections = processTokens();
  const semanticCollections = processTokens();
  processTokenCollection(primitiveTokens, primitiveCollections);
  processTokenCollection(boundSemanticTokens, semanticCollections);
  // Also process standalone non-color semantics (fonts, spacing, etc.) into semanticCollections
  // They should always appear in @theme regardless of the flag
  processTokenCollection(standaloneSemanticNonColors, semanticCollections);

  // Process standalone semantic colors separately (for :root only when flag is true)
  const standaloneSemanticCollections = processTokens();
  processTokenCollection(standaloneSemanticColors, standaloneSemanticCollections);

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

  // First, output :root with primitives
  // When excludeSemanticColorsFromTheme is true, also include ALL semantic colors in :root
  const hasPrimitives = Object.values(primitiveCollections).some((map) => map.size > 0);
  const hasStandaloneSemantics = Object.values(standaloneSemanticCollections).some(
    (map) => map.size > 0,
  );

  if (hasPrimitives || (excludeSemanticColorsFromTheme && hasStandaloneSemantics)) {
    result += ':root {\n';
    // Output all primitives with actual values
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

    // When excludeSemanticColorsFromTheme is true, add standalone semantic colors to :root
    if (excludeSemanticColorsFromTheme) {
      result += outputCollection(standaloneSemanticCollections.colorTokens);
      // Also add bound semantic colors to :root when flag is true
      result += outputCollection(semanticCollections.colorTokens);
    }

    result += '}\n\n';
  }

  // Extract mode information from the collection
  // If collection.modes is not available, fall back to extracting from tokens
  const modesMap = collection.modes || extractModesFromTokens(variableTokens);

  // Filter out typography-only modes (line-height variations)
  // TODO: Implement proper support for typography modes with separate attribute (e.g., data-line-height)
  // See: [JIRA ticket to be created]
  const filteredModesMap = filterTypographyOnlyModes(modesMap, variableTokens);

  const modes = Array.from(filteredModesMap.entries()); // If we have multiple modes, output mode-specific blocks for tokens that vary by mode
  if (modes.length > 1) {
    const defaultModeId = modes[0][0]; // First mode is the default
    const defaultModeName = modes[0][1];

    // Collect default mode semantic tokens (these go in :root or :root, [data-theme='default'])
    const defaultModeTokens: VariableToken[] = [];

    for (const token of [
      ...standaloneSemanticColors,
      ...standaloneSemanticNonColors,
      ...boundSemanticTokens,
    ]) {
      // For ModeVariableTokens, create a variant with the default mode value
      if (isModeVariableToken(token)) {
        defaultModeTokens.push({
          ...token,
          rawValue: token.modeValues[defaultModeId],
        });
      } else {
        // For StandardVariableTokens, use as-is
        defaultModeTokens.push(token);
      }
    }

    if (defaultModeTokens.length > 0 && !excludeSemanticColorsFromTheme) {
      const defaultSemanticCollections = processTokens();
      processTokenCollection(defaultModeTokens, defaultSemanticCollections);

      const hasSemantics = Object.values(defaultSemanticCollections).some((map) => map.size > 0);

      if (hasSemantics) {
        result += `/* ${defaultModeName} mode semantic tokens (default) */\n`;
        result += `:root,\n[data-theme='${defaultModeName}'] {\n`;
        result += outputCollection(defaultSemanticCollections.colorTokens);
        result += outputCollection(defaultSemanticCollections.spacingTokens);
        result += outputCollection(defaultSemanticCollections.fontFamilyTokens);
        result += outputCollection(defaultSemanticCollections.fontWeightTokens);
        result += outputCollection(defaultSemanticCollections.fontSizeTokens);
        result += outputCollection(defaultSemanticCollections.borderWidthTokens);
        result += outputCollection(defaultSemanticCollections.borderRadiusTokens);
        result += outputCollection(defaultSemanticCollections.lineHeightTokens);
        result += outputCollection(defaultSemanticCollections.iconSizeTokens);
        result += outputCollection(defaultSemanticCollections.screenSizeTokens);
        result += outputCollection(defaultSemanticCollections.boxShadowTokens);
        result += '}\n\n';
      }
    }
    // Output alternate mode overrides
    for (let i = 1; i < modes.length; i++) {
      const [modeId, modeName] = modes[i];
      const modeTokens: VariableToken[] = [];

      // Process semantic tokens with mode-specific values
      for (const token of [
        ...standaloneSemanticColors,
        ...standaloneSemanticNonColors,
        ...boundSemanticTokens,
      ]) {
        if (isModeVariableToken(token) && token.modeValues[modeId]) {
          // For semantic tokens with modePrimitiveRefs, use the mode-specific primitive reference
          const modePrimitiveRef =
            token.modePrimitiveRefs && token.modePrimitiveRefs[modeId]
              ? token.modePrimitiveRefs[modeId]
              : token.primitiveRef;

          modeTokens.push({
            ...token,
            rawValue: token.modeValues[modeId],
            primitiveRef: modePrimitiveRef,
          });
        }
      }

      // Process primitives with mode-specific values
      for (const token of primitiveTokens) {
        if (isModeVariableToken(token) && token.modeValues[modeId]) {
          modeTokens.push({
            ...token,
            rawValue: token.modeValues[modeId],
          });
        }
      }

      if (modeTokens.length > 0) {
        const modeCollections = processTokens();
        processTokenCollection(modeTokens, modeCollections);

        const hasTokens = Object.values(modeCollections).some((map) => map.size > 0);

        if (hasTokens) {
          result += `/* ${modeName} mode overrides */\n`;
          result += `[data-theme='${modeName}'] {\n`;
          result += outputCollection(modeCollections.colorTokens);
          result += outputCollection(modeCollections.spacingTokens);
          result += outputCollection(modeCollections.fontFamilyTokens);
          result += outputCollection(modeCollections.fontWeightTokens);
          result += outputCollection(modeCollections.fontSizeTokens);
          result += outputCollection(modeCollections.borderWidthTokens);
          result += outputCollection(modeCollections.borderRadiusTokens);
          result += outputCollection(modeCollections.lineHeightTokens);
          result += outputCollection(modeCollections.iconSizeTokens);
          result += outputCollection(modeCollections.screenSizeTokens);
          result += outputCollection(modeCollections.boxShadowTokens);
          result += '}\n\n';
        }
      }
    }
  }

  // Then, output @theme with simplified Tailwind naming convention
  // Maps simplified names (--color-*, --leading-*, etc.) to full CSS variable names
  // NOTE: With mode support, @theme only includes semantic tokens that reference
  // the mode-aware variables defined in :root and [data-theme] blocks.
  // Without modes, it includes both primitives and semantics for backward compatibility.
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

  // Helper to output theme collection with self-referencing variables
  // For multi-mode scenarios, semantic tokens reference themselves to allow
  // [data-theme] overrides to work correctly
  const outputSelfReferencingCollection = (map: Map<string, string>) => {
    const entries: Array<string> = [];
    for (const [key] of map.entries()) {
      // For semantic tokens in multi-mode, they reference themselves
      // e.g., --colour-button-primary-text-hover: var(--colour-button-primary-text-hover);
      entries.push(key);
    }

    // Sort by key name
    entries.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    let output = '';
    for (const key of entries) {
      // Remove the -- prefix for the var() reference
      const varName = key.substring(2);
      output += `  ${key}: var(--${varName});\n`;
    }
    return output;
  };

  // Conditional logic: with multiple modes, only output semantics to @theme
  // Without modes (single mode), output both primitives and semantics
  const hasMultipleModes = modes.length > 1;

  if (hasMultipleModes) {
    // Multi-mode: Output semantic tokens in @theme with self-references
    // This allows [data-theme] blocks to override the actual values
    // e.g., --colour-button-primary: var(--colour-button-primary);
    if (Object.values(semanticCollections).some((map) => map.size > 0)) {
      // When excludeSemanticColorsFromTheme is true, skip semantic colors to prevent
      // Tailwind from auto-generating utilities (we'll generate custom @utility rules instead)
      if (!excludeSemanticColorsFromTheme) {
        result += outputSelfReferencingCollection(semanticCollections.colorTokens);
      }
      result += outputSelfReferencingCollection(semanticCollections.spacingTokens);
      result += outputSelfReferencingCollection(semanticCollections.fontFamilyTokens);
      result += outputSelfReferencingCollection(semanticCollections.fontWeightTokens);
      result += outputSelfReferencingCollection(semanticCollections.fontSizeTokens);
      result += outputSelfReferencingCollection(semanticCollections.borderWidthTokens);
      result += outputSelfReferencingCollection(semanticCollections.borderRadiusTokens);
      result += outputSelfReferencingCollection(semanticCollections.lineHeightTokens);
      result += outputSelfReferencingCollection(semanticCollections.iconSizeTokens);
      result += outputSelfReferencingCollection(semanticCollections.screenSizeTokens);
      result += outputSelfReferencingCollection(semanticCollections.boxShadowTokens);
    }

    // When excludeSemanticColorsFromTheme is false, also add standalone semantic colors to @theme
    // (they're already in :root when the flag is true, so only add to @theme when flag is false)
    if (
      !excludeSemanticColorsFromTheme &&
      Object.values(standaloneSemanticCollections).some((map) => map.size > 0)
    ) {
      result += outputSelfReferencingCollection(standaloneSemanticCollections.colorTokens);
    }
  } else {
    // Single mode (or no modes): Include both primitives and semantics in @theme
    // This is the original behavior for backward compatibility
    if (Object.values(primitiveCollections).some((map) => map.size > 0)) {
      result += outputThemeCollection(primitiveCollections.colorTokens);
      result += outputThemeCollection(primitiveCollections.spacingTokens);
      result += outputThemeCollection(primitiveCollections.fontFamilyTokens);
      result += outputThemeCollection(primitiveCollections.fontWeightTokens);
      result += outputThemeCollection(primitiveCollections.fontSizeTokens);
      result += outputThemeCollection(primitiveCollections.borderWidthTokens);
      result += outputThemeCollection(primitiveCollections.borderRadiusTokens);
      result += outputThemeCollection(primitiveCollections.lineHeightTokens);
      result += outputThemeCollection(primitiveCollections.iconSizeTokens);
      result += outputThemeCollection(primitiveCollections.screenSizeTokens);
      result += outputThemeCollection(primitiveCollections.boxShadowTokens);
    }

    if (Object.values(semanticCollections).some((map) => map.size > 0)) {
      // When excludeSemanticColorsFromTheme is true, skip semantic colors
      if (!excludeSemanticColorsFromTheme) {
        result += outputThemeCollection(semanticCollections.colorTokens);
      }
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

    // When excludeSemanticColorsFromTheme is false, also add standalone semantic colors to @theme
    if (
      !excludeSemanticColorsFromTheme &&
      Object.values(standaloneSemanticCollections).some((map) => map.size > 0)
    ) {
      result += outputThemeCollection(standaloneSemanticCollections.colorTokens);
    }
  }

  result += '}\n';

  return result;
}

/**
 * Build dynamic theme mapping from variable tokens for use in generators
 * @param variableTokens - Array of variable tokens
 * @param excludeSemanticColors - When true, excludes semantic colors from the theme mapping
 */
export function buildDynamicThemeTokens(
  variableTokens: VariableToken[],
  excludeSemanticColors = false,
) {
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
    // rawValue is always an actual value (hex, px, etc.), never a variable reference
    let cleanName = token.name;

    // Determine the actual token type from the name, not just the property
    if (
      token.property === 'color' ||
      token.property.includes('color') ||
      cleanName.startsWith('colors-')
    ) {
      cleanName = cleanName.replace(/^colors-/, '').replace(/^color-/, '');

      // When excludeSemanticColors is true AND this is a semantic token with primitiveRef:
      // Map to the semantic name instead of primitive name
      // This allows components to reference semantic color utilities
      if (excludeSemanticColors && token.primitiveRef) {
        // Use the semantic variable name directly (already cleaned)
        dynamicTheme.colors[token.rawValue] = cleanName;
      } else {
        // Default behavior: use the token name (could be primitive or semantic)
        dynamicTheme.colors[token.rawValue] = cleanName;
      }
    } else if (cleanName.includes('border-radius') || token.property === 'border-radius') {
      // Border radius tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-radius-/, '').replace(/^border-radius-/, '');
      dynamicTheme.borderRadius[token.rawValue] = cleanName;
    } else if (cleanName.includes('border-width') || token.property === 'border-width') {
      // Border width tokens (even if categorized as spacing)
      cleanName = cleanName.replace(/^.*border-width-/, '').replace(/^border-width-/, '');
      // If the extracted name is 'border' (the property name itself), it's the default border width
      // Map it to 'DEFAULT' so Tailwind uses just 'border' class, not 'border-border'
      if (cleanName === 'border') {
        cleanName = 'DEFAULT';
      }
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
      cleanName = cleanName
        .replace(/^effect-/, '')
        .replace(/^shadow-/, '')
        .replace(/^box-shadow-/, '');
      dynamicTheme.boxShadow[token.rawValue] = cleanName;
    } else if (token.property === 'spacing') {
      // Pure spacing tokens only (not border, font, icon, or screen related)
      cleanName = cleanName.replace(/^spacing-/, '');
      dynamicTheme.spacing[token.rawValue] = cleanName;
    }
  }

  return dynamicTheme;
}

/**
 * Generate custom @utility rules for semantic color tokens based on their naming patterns.
 * Only generates utilities for colors with 'bg', 'text', or 'border' in their names.
 *
 * @param semanticColorTokens - Array of semantic color variable tokens
 * @returns CSS string containing @utility rules
 */
export function generateSemanticColorUtilities(semanticColorTokens: VariableToken[]): string {
  if (!semanticColorTokens.length) {
    return '';
  }

  let output = '\n/* Custom Semantic Color Utilities */\n';
  const processedNames = new Set<string>(); // Track processed names to avoid duplicates

  for (const token of semanticColorTokens) {
    // Use the EXACT same name cleaning logic as the :root generation (line 57-58)
    const cleanName = token.name.replace(/^colors-/, '').replace(/^color-/, '');

    // Skip if we've already processed this name (avoid duplicates)
    if (processedNames.has(cleanName)) {
      continue;
    }

    // Determine utility type based on name pattern (case-insensitive)
    const lowerName = cleanName.toLowerCase();
    let utilityProperty: string | null = null;

    if (lowerName.includes('bg') || lowerName.includes('background')) {
      utilityProperty = 'background-color';
    } else if (lowerName.includes('text') || lowerName.includes('foreground')) {
      utilityProperty = 'color';
    } else if (lowerName.includes('border')) {
      utilityProperty = 'border-color';
    }

    // Only generate utility if we can determine the property from the name
    if (utilityProperty) {
      processedNames.add(cleanName);
      // Use cleanName for the utility class name, but cssVarName for the var() reference
      output += `\n@utility ${cleanName} {\n  ${utilityProperty}: var(--${cleanName});\n}\n`;
    }
  }

  return output;
}
