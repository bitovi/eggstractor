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

/**
 * Generate CSS variables with multi-mode support (without category prefixes or @theme directive)
 *
 * This function produces CSS variables for plain CSS usage:
 * 1. :root - Contains all tokens with default mode values
 * 2. [data-theme='modeName'] - Contains mode-specific overrides for theming
 *
 * Unlike generateThemeDirective, this function:
 * - Does NOT add category prefixes (--color-, --spacing-, etc.)
 * - Does NOT generate @theme directive
 * - Uses simple variable names (--primary-color instead of --color-primary)
 *
 * @param collection - Token collection with primitives and semantics
 * @returns CSS string with :root and [data-theme] blocks
 */
export function generateCssVariablesWithModes(collection: TokenCollection): string {
  const variableTokens = collection.tokens.filter((token) => token.type === 'variable');

  // Separate primitives and semantics
  const primitiveTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'primitive',
  );
  const semanticTokens = variableTokens.filter(
    (token) => token.metadata?.variableTokenType === 'semantic',
  );

  let result = '';

  // Helper to convert primitive name to simple CSS variable reference (no category prefix)
  const convertToSimpleVarReference = (primitiveName: string): string => {
    // For plain CSS, just reference the variable as-is without adding or removing prefixes
    // The primitive token name is already clean (e.g., "color-primary", "spacing-base")
    return `var(--${primitiveName})`;
  };

  // Helper to output variables without category prefixes
  const outputSimpleVariables = (tokens: VariableToken[]) => {
    const variables = new Map<string, string>();

    for (const token of tokens) {
      const varName = `--${token.name}`;
      let value: string;

      if (token.primitiveRef) {
        // Semantic token - reference the primitive
        value = convertToSimpleVarReference(token.primitiveRef);
      } else {
        // Primitive token - use raw value
        value = token.rawValue;
      }

      variables.set(varName, value);
    }

    // Sort and output
    const sorted = Array.from(variables.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );

    let output = '';
    for (const [key, value] of sorted) {
      output += `  ${key}: ${value};\n`;
    }
    return output;
  };

  // Output :root with all tokens (default mode values)
  if (variableTokens.length > 0) {
    result += ':root {\n';
    result += outputSimpleVariables(primitiveTokens);
    result += outputSimpleVariables(semanticTokens);
    result += '}\n\n';
  }

  // Extract mode information
  const modesMap = collection.modes || extractModesFromTokens(variableTokens);
  const filteredModesMap = filterTypographyOnlyModes(modesMap, variableTokens);
  const modes = Array.from(filteredModesMap.entries());

  // If we have multiple modes, output mode-specific blocks
  if (modes.length > 1) {
    for (let i = 0; i < modes.length; i++) {
      const [modeId, modeName] = modes[i];
      const modeTokens: VariableToken[] = [];

      // Collect tokens with mode-specific values
      for (const token of variableTokens) {
        if (isModeVariableToken(token) && token.modeValues[modeId]) {
          // For semantic tokens, get mode-specific primitive reference if available
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

      if (modeTokens.length > 0) {
        result += `/* ${modeName} mode overrides */\n`;
        result += `[data-theme='${modeName}'] {\n`;
        result += outputSimpleVariables(modeTokens);
        result += '}\n\n';
      }
    }
  }

  return result;
}

/**
 * Generate Tailwind 4 CSS with @theme directive from design tokens
 *
 * This function produces three main CSS blocks:
 * 1. :root - Contains primitive tokens with actual values (e.g., --color-blue-500: #0080ff)
 * 2. [data-theme='modeName'] - Contains mode-specific overrides for theming (e.g., light/dark modes)
 * 3. @theme - Tailwind 4's theme configuration that maps CSS variables to utility classes
 *
 * @param collection - Token collection with primitives and semantics
 * @param excludeSemanticColorsFromTheme - Controls semantic color handling:
 *   - false (default): Semantic colors appear in @theme → Tailwind auto-generates utilities like `bg-action-bg-primary`
 *   - true: Semantic colors excluded from @theme → Prevents auto-generation, use custom @utility rules instead
 *
 * Key behaviors:
 *
 * ## Color Prefixing (--color-)
 * - ALL color tokens in @theme MUST have --color- prefix per Tailwind 4 requirements
 * - Primitives: Already prefixed (e.g., --color-blue-500)
 * - Semantics: Prefixed during @theme output (e.g., --action-bg → --color-action-bg)
 * - Supports both 'color-' and 'colour-' prefixes (international naming)
 *
 * ## Multi-mode vs Single-mode
 *
 * ### Multi-mode (Light/Dark themes):
 * - :root: Contains color primitives + non-color primitives with actual values
 * - [data-theme]: Contains mode-specific token overrides
 * - @theme:
 *   - Primitives: Non-color only (spacing, fonts, borders, etc.) with actual values
 *   - Color primitives: Excluded when excludeSemanticColorsFromTheme=true, included when false
 *   - Semantics: Self-referencing (e.g., --color-action-bg: var(--action-bg)) to enable theme switching
 *
 * ### Single-mode (No theming):
 * - :root: Contains primitives with actual values
 * - @theme: Contains both primitives AND semantics with actual values (backward compatibility)
 *
 * ## excludeSemanticColorsFromTheme flag
 * When true:
 * - Prevents Tailwind from generating hundreds of color utilities (bg-*, text-*, border-*)
 * - Semantic colors moved to :root (available as CSS variables)
 * - Companion function generateSemanticColorUtilities() creates targeted @utility rules
 * - Non-color semantic tokens (spacing, fonts, etc.) still appear in @theme
 *
 * When false:
 * - Semantic colors appear in @theme
 * - Tailwind auto-generates full utility class set
 * - Use this for comprehensive utility coverage at the cost of larger CSS
 *
 * @returns CSS string with :root, [data-theme], and @theme blocks
 */
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
    // Output mode overrides for ALL modes
    // Note: We start from index 0 (not 1) to include all modes
    // We don't create a redundant :root, [data-theme='Values'] block anymore
    for (let i = 0; i < modes.length; i++) {
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
    } else if (name.startsWith('color-')) {
      // Already has color- prefix (primitives), keep it
      return name;
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
    // For anything else, return as-is (without adding prefixes automatically)
    return name;
  };

  /**
   * Output theme collection with simplified names and actual values
   * Used for: primitives in both single-mode and multi-mode scenarios
   *
   * @param map - Collection of tokens (e.g., colorTokens, spacingTokens)
   * @param isColorCollection - If true, ensures all keys have --color- prefix for Tailwind 4
   *
   * THE --color- PREFIX REQUIREMENT:
   * Tailwind 4 requires ALL color tokens in @theme to have --color- prefix.
   * This applies to both primitives and semantics:
   * - Primitives: --color-blue-500: #0080ff;
   * - Semantics: --color-action-bg: var(--action-bg);
   *
   * Without this prefix, Tailwind won't recognize them as colors and won't generate
   * color utilities (bg-*, text-*, border-*) for these tokens.
   *
   * We check for existing 'color-' or 'colour-' prefixes to support international naming
   * conventions (e.g., UK English 'colour') and avoid double-prefixing.
   *
   * Example output:
   *   --color-blue-500: #0080ff;
   *   --spacing-4: 16px;
   */
  const outputThemeCollection = (map: Map<string, string>, isColorCollection = false) => {
    const entries: Array<[string, string]> = [];
    for (const [key, value] of map.entries()) {
      const simplifiedKey = extractSimplifiedName(key);
      // CRITICAL: Check if color prefix already exists to avoid double-prefixing
      // Handles both 'color-' and 'colour-' for international compatibility
      // Example: --action-bg becomes --color-action-bg
      // But: --colour-button-text stays as --colour-button-text
      const hasColorPrefix =
        simplifiedKey.startsWith('color-') || simplifiedKey.startsWith('colour-');
      const finalKey =
        isColorCollection && !hasColorPrefix ? `--color-${simplifiedKey}` : `--${simplifiedKey}`;
      entries.push([finalKey, value]);
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

  /**
   * Output theme collection with self-referencing variables
   * Used for: semantic tokens in multi-mode scenarios to enable theme switching
   *
   * @param map - Collection of semantic tokens
   * @param isColorCollection - If true, ensures all keys have --color- prefix for Tailwind 4
   *
   * Why self-referencing?
   * In multi-mode, semantic tokens in @theme reference their :root counterparts:
   *   @theme: --color-action-bg: var(--action-bg);
   * This allows [data-theme] blocks to override --action-bg and have @theme pick up the change
   *
   * Example flow:
   *   :root { --action-bg: var(--color-blue-500); }
   *   [data-theme='dark'] { --action-bg: var(--color-blue-700); }
   *   @theme { --color-action-bg: var(--action-bg); }
   * Result: Tailwind's bg-action-bg utility automatically adapts to theme changes
   */
  const outputSelfReferencingCollection = (map: Map<string, string>, isColorCollection = false) => {
    const entries: Array<[string, string]> = [];
    for (const [key] of map.entries()) {
      // For semantic tokens in multi-mode, they reference themselves
      // Apply the same simplification logic as outputThemeCollection to add --color- prefix
      const simplifiedKey = extractSimplifiedName(key);
      // For color collections, if the key doesn't already have a color- or colour- prefix, add it
      // e.g., --color-action-bg-error-default: var(--action-bg-error-default);
      // But preserves existing prefixes like --colour-button-primary-text-hover
      const hasColorPrefix =
        simplifiedKey.startsWith('color-') || simplifiedKey.startsWith('colour-');
      const finalKey =
        isColorCollection && !hasColorPrefix ? `--color-${simplifiedKey}` : `--${simplifiedKey}`;
      entries.push([finalKey, key]);
    }

    // Sort by simplified key name
    entries.sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );

    let output = '';
    for (const [simplifiedKey, originalKey] of entries) {
      // Remove the -- prefix for the var() reference
      const varName = originalKey.substring(2);
      output += `  ${simplifiedKey}: var(--${varName});\n`;
    }
    return output;
  };

  /**
   * MULTI-MODE vs SINGLE-MODE LOGIC
   *
   * The @theme directive generation differs based on whether the design system has theming:
   *
   * MULTI-MODE (hasMultipleModes = true):
   * - Design system has Light/Dark or other theme variations
   * - @theme contains:
   *   1. Non-color primitives (spacing, fonts, borders, shadows) - actual values
   *   2. Color primitives - included/excluded based on excludeSemanticColorsFromTheme flag
   *   3. Semantic tokens - self-referencing to enable theme switching
   * - Theme switching happens via [data-theme] attribute changing --var values
   *
   * SINGLE-MODE (hasMultipleModes = false):
   * - Design system has no theme variations (one appearance only)
   * - @theme contains ALL tokens (primitives + semantics) with actual values
   * - Simpler output for backward compatibility and single-theme systems
   */
  const hasMultipleModes = modes.length > 1;

  if (hasMultipleModes) {
    // Multi-mode: Output tokens in @theme
    // When excludeSemanticColorsFromTheme is false, include color primitives in @theme
    // When true, exclude color primitives but still include all non-color primitives
    if (Object.values(primitiveCollections).some((map) => map.size > 0)) {
      if (!excludeSemanticColorsFromTheme) {
        result += outputThemeCollection(primitiveCollections.colorTokens, true);
      }
      // Always output non-color primitives regardless of the flag
      // These are essential for Tailwind utilities (spacing, fonts, borders, etc.)
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

    /**
     * SEMANTIC TOKENS IN MULTI-MODE
     *
     * Semantic tokens use self-referencing to enable theme switching:
     * - They reference their :root counterparts which [data-theme] can override
     * - This creates a chain: @theme → :root var → [data-theme] override
     *
     * excludeSemanticColorsFromTheme behavior:
     * - true: Skip color semantics → prevents Tailwind utility generation → use custom @utility rules
     * - false: Include color semantics → Tailwind generates bg-*, text-*, border-* utilities
     *
     * Non-color semantics (fonts, spacing, etc.) are ALWAYS included regardless of flag
     */
    if (Object.values(semanticCollections).some((map) => map.size > 0)) {
      if (!excludeSemanticColorsFromTheme) {
        // Include semantic colors in @theme → enables auto-generated Tailwind utilities
        result += outputSelfReferencingCollection(semanticCollections.colorTokens, true);
      }
      // Always output non-color semantic tokens (fonts, spacing, borders, etc.)
      // These don't create utility bloat like colors do
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

    /**
     * STANDALONE SEMANTIC COLORS
     *
     * Standalone semantic colors are top-level color tokens not bound to components
     * (e.g., --action-bg-primary vs component-specific --button-primary-bg)
     *
     * When excludeSemanticColorsFromTheme=false: Add to @theme with self-references
     * When excludeSemanticColorsFromTheme=true: Already in :root, skip @theme
     */
    if (
      !excludeSemanticColorsFromTheme &&
      Object.values(standaloneSemanticCollections).some((map) => map.size > 0)
    ) {
      result += outputSelfReferencingCollection(standaloneSemanticCollections.colorTokens, true);
    }
  } else {
    /**
     * SINGLE-MODE BEHAVIOR (No theming)
     *
     * Simpler output for systems without theme variations:
     * - @theme gets ALL tokens (primitives + semantics) with actual values
     * - No self-referencing needed since there are no theme overrides
     * - Color primitives respect excludeSemanticColorsFromTheme flag
     * - Backward compatible with pre-theming systems
     */
    if (Object.values(primitiveCollections).some((map) => map.size > 0)) {
      if (!excludeSemanticColorsFromTheme) {
        // Include color primitives for comprehensive utility generation
        result += outputThemeCollection(primitiveCollections.colorTokens, true);
      }
      // Always output non-color primitives - foundation of design system
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

    // Semantic tokens in single-mode use actual values (no self-referencing needed)
    if (Object.values(semanticCollections).some((map) => map.size > 0)) {
      if (!excludeSemanticColorsFromTheme) {
        // Include semantic colors → enables Tailwind utility generation
        result += outputThemeCollection(semanticCollections.colorTokens, true);
      }
      // Always include non-color semantic tokens
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

    // Standalone semantic colors in single-mode
    if (
      !excludeSemanticColorsFromTheme &&
      Object.values(standaloneSemanticCollections).some((map) => map.size > 0)
    ) {
      result += outputThemeCollection(standaloneSemanticCollections.colorTokens, true);
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
 *
 * PURPOSE:
 * This function is the companion to generateThemeDirective when excludeSemanticColorsFromTheme=true.
 * It creates targeted @utility rules for semantic colors to avoid Tailwind's default behavior of
 * generating hundreds of color utility variants (bg-*, text-*, border-*) for every semantic color.
 *
 * WORKFLOW:
 * 1. excludeSemanticColorsFromTheme=true → Semantic colors excluded from @theme
 * 2. generateThemeDirective puts semantic colors in :root as CSS variables
 * 3. This function generates specific @utility rules for those colors
 * 4. Result: Precise utility classes (e.g., bg-action-bg-primary) without utility bloat
 *
 * NAME-BASED DETECTION:
 * Determines utility type by token name pattern (case-insensitive):
 * - Contains 'bg' or 'background' → background-color utility
 * - Contains 'text' or 'foreground' → color (text color) utility
 * - Contains 'border' → border-color utility
 * - No match → skipped (not suitable for utility generation)
 *
 * EXAMPLES:
 * Input tokens:
 *   --action-bg-primary: var(--color-blue-500)
 *   --action-text-primary: var(--color-white)
 *   --action-border-primary: var(--color-blue-600)
 *
 * Generated output:
 *   @utility action-bg-primary { background-color: var(--action-bg-primary); }
 *   @utility action-text-primary { color: var(--action-text-primary); }
 *   @utility action-border-primary { border-color: var(--action-border-primary); }
 *
 * Usage in HTML: <button class="action-bg-primary action-text-primary">
 *
 * @param semanticColorTokens - Array of semantic color variable tokens
 * @returns CSS string containing @utility rules, or empty string if no tokens
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
