import { NonNullableStyleToken, TokenCollection, VariableToken } from '../../types';
import { groupBy } from '../utils/group-by.utils';
import { convertToGeneratorTokens, convertVariantGroupBy } from '../variants';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';
import { getStylePropertyAndValue } from '../utils';
import {
  createNamingContext,
  tailwind4NamingConfig,
  generateThemeDirective,
  buildDynamicThemeTokens,
  generateSemanticColorUtilities,
  generateCssVariablesWithModes,
  generateScssLayerUtilitiesFromModes,
  defaultContextConfig,
} from '../../utils';
import { Transformer } from '../types';

/**
 * Transforms a token collection to Tailwind-compatible SCSS mixins.
 *
 * @param collection - The token collection to transform
 * @param useCombinatorialParsing - Whether to use combinatorial parsing for variants
 * @param _generateSemantics - (Deprecated) Semantic utilities are not supported in SCSS mode
 * @param outputMode - Determines what to output:
 *   - 'variables': CSS variables with multi-mode support + @layer utilities (no mixins)
 *   - 'components': Only SCSS mixins with @apply directives (no variables)
 *   - 'all': CSS variables with multi-mode + @layer utilities + mixins (default behavior)
 * @returns TransformerResult with the generated SCSS code
 */
export const transformToTailwindSassClass: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  _generateSemantics,
  outputMode = 'all',
  includePageInPath = true,
) => {
  // For 'variables' mode, output CSS variables with multi-mode support + @layer utilities
  if (outputMode === 'variables') {
    const variableTokens = collection.tokens.filter(
      (token): token is VariableToken => token.type === 'variable',
    );

    if (variableTokens.length === 0) {
      return {
        result: '/* No variables found */',
        warnings: [],
        errors: [],
      };
    }

    let output = '/* Generated CSS Variables */\n';

    // Generate CSS variables with multi-mode support (:root and [data-theme] blocks)
    const cssVariables = generateCssVariablesWithModes(collection);
    if (cssVariables) {
      output += cssVariables;
    }

    // Generate @layer utilities from semantic color tokens
    const semanticColorTokens = variableTokens.filter(
      (token) =>
        token.metadata?.variableTokenType === 'semantic' &&
        token.path.length === 0 && // standalone, not bound to components
        (token.property === 'color' ||
          token.property === 'background' ||
          token.property === 'background-color' ||
          token.property === 'border-color'),
    );

    if (semanticColorTokens.length > 0) {
      output += generateScssLayerUtilitiesFromModes(semanticColorTokens);
    }

    return {
      result: output,
      warnings: [],
      errors: [],
    };
  }

  // For 'components' and 'all' modes, generate mixins
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token: NonNullableStyleToken) => token.name);
  const namingContext = createNamingContext({
    ...defaultContextConfig,
    includePageInPath,
  });
  const selectors = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  let output = '/* Generated Tailwind-SCSS */';

  // For 'all' mode, include CSS variables with multi-mode + @layer utilities
  if (outputMode === 'all') {
    const variableTokens = collection.tokens.filter(
      (token): token is VariableToken => token.type === 'variable',
    );

    if (variableTokens.length > 0) {
      output += '\n\n/* CSS Variables */\n';

      // Generate CSS variables with multi-mode support
      const cssVariables = generateCssVariablesWithModes(collection);
      if (cssVariables) {
        output += cssVariables;
      }

      // Generate @layer utilities from semantic color tokens
      const semanticColorTokens = variableTokens.filter(
        (token) =>
          token.metadata?.variableTokenType === 'semantic' &&
          token.path.length === 0 && // standalone, not bound to components
          (token.property === 'color' ||
            token.property === 'background' ||
            token.property === 'background-color' ||
            token.property === 'border-color'),
      );

      if (semanticColorTokens.length > 0) {
        output += generateScssLayerUtilitiesFromModes(semanticColorTokens);
      }
    }
  }

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = convertToGeneratorTokens(selectors).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  /**
   * Build dynamic theme tokens for SCSS generation.
   * Pass generateSemantics = true to make the generator use semanticVariableName directly
   * (same behavior as Tailwind v4), which bypasses the prefix-adding logic and uses
   * the semantic utility names as-is (e.g., 'action-bg-primary' instead of 'bg-action-bg-primary').
   * This allows @apply to reference the @layer utilities we generated above.
   */
  const variableTokens = collection.tokens.filter(
    (token): token is VariableToken => token.type === 'variable',
  );
  const dynamicThemeTokens = buildDynamicThemeTokens(variableTokens, false);

  for (const { variantPath, tokens } of formattedStyleTokens) {
    const classesToApply = createTailwindClasses(tokens, dynamicThemeTokens, true);

    if (classesToApply.length) {
      output += `\n@mixin ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }

  return {
    result: output,
    warnings,
    errors,
  };
};

/**
 * Transforms a token collection to Tailwind v4 CSS with @theme and @utility directives.
 *
 * @param collection - The token collection to transform
 * @param useCombinatorialParsing - Whether to use combinatorial parsing for variants
 * @param generateSemantics - Whether to generate semantic color utilities (default: true)
 * @param outputMode - Determines what to output:
 *   - 'variables': Only @theme directive with CSS variables (no utilities)
 *   - 'components': Only @utility directives and semantic color utilities (no theme)
 *   - 'all': Theme, semantic utilities, and component utilities (default behavior)
 * @returns TransformerResult with the generated Tailwind v4 CSS code
 */
export const transformToTailwindLayerUtilityClassV4: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  generateSemantics = true,
  outputMode = 'all',
  includePageInPath = true,
) => {
  // Extract semantic colors for custom utilities (if enabled)
  let semanticColorTokens: VariableToken[] = [];

  if (generateSemantics) {
    // Filter for semantic color tokens that were collected by collectSemanticColorVariables
    semanticColorTokens = collection.tokens.filter(
      (token): token is VariableToken =>
        token.type === 'variable' &&
        token.metadata?.variableTokenType === 'semantic' &&
        token.property === 'color',
    );
  }

  const variableTokens = collection.tokens.filter(
    (token): token is VariableToken => token.type === 'variable',
  );

  // For 'variables' mode, only output the theme directive
  if (outputMode === 'variables') {
    // Generate the @theme directive with mode-based CSS
    const themeDirective = generateThemeDirective(collection, generateSemantics);

    return {
      result: themeDirective,
      warnings: [],
      errors: [],
    };
  }

  // For 'components' and 'all' modes, process style tokens
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);
  const namingContext = createNamingContext({
    ...tailwind4NamingConfig,
    includePageInPath,
  });

  const selectors = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = convertToGeneratorTokens(selectors).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  // When generateSemantics is true, exclude semantic colors from dynamic theme mapping
  const dynamicThemeTokens = buildDynamicThemeTokens(variableTokens, generateSemantics);

  let output = '';

  // For 'all' mode, include the theme directive
  if (outputMode === 'all') {
    const themeDirective = generateThemeDirective(collection, generateSemantics);
    output = themeDirective;
  }

  // Generate custom semantic color utilities (before component utilities)
  // Include these in both 'components' and 'all' modes
  if (generateSemantics && semanticColorTokens.length > 0) {
    output += generateSemanticColorUtilities(semanticColorTokens);
  }

  output += '\n\n/* Generated Tailwind Utilities */\n';

  for (const { variantPath, tokens } of formattedStyleTokens) {
    // Pass dynamic theme tokens to the generator
    const classesToApply = createTailwindClasses(tokens, dynamicThemeTokens, generateSemantics);
    if (classesToApply.length) {
      output += `\n@utility ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }

  return {
    result: output,
    warnings,
    errors,
  };
};
