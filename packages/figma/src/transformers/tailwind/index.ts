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
} from '../../utils';
import { Transformer } from '../types';

/**
 * Transforms a token collection to Tailwind-compatible SCSS mixins.
 *
 * @param collection - The token collection to transform
 * @param useCombinatorialParsing - Whether to use combinatorial parsing for variants
 * @param _generateSemantics - (Deprecated) Semantic utilities are not supported in SCSS mode
 * @param outputMode - Determines what to output:
 *   - 'variables': Only CSS variables in :root (no mixins)
 *   - 'components': Only SCSS mixins with @apply directives (no variables)
 *   - 'all': Both variables and mixins (default behavior)
 * @returns TransformerResult with the generated SCSS code
 */
export const transformToTailwindSassClass: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  _generateSemantics,
  outputMode = 'all',
) => {
  // For 'variables' mode, output CSS variables only
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

    let output = '/* Generated CSS Variables */\n:root {\n';

    for (const token of variableTokens) {
      const varName = `--${token.name}`;
      output += `  ${varName}: ${token.rawValue};\n`;
    }

    output += '}\n';

    return {
      result: output,
      warnings: [],
      errors: [],
    };
  }

  // For 'components' and 'all' modes, generate mixins
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token: NonNullableStyleToken) => token.name);
  const namingContext = createNamingContext();
  const { selectors, warnings: variantWarnings } = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  // Merge warnings from filterStyleTokens and convertVariantGroupBy
  const allWarnings = [...warnings, ...variantWarnings];

  let output = '/* Generated Tailwind-SCSS */';

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = convertToGeneratorTokens(selectors).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  /**
   * don't use a theme mapping for Tailwind-SCSS generation; themeMapping works only for Tailwind v4+, and sass variables aren't compatible with tailwind built-in utilities.
   */
  for (const { variantPath, tokens } of formattedStyleTokens) {
    const classesToApply = createTailwindClasses(tokens);

    if (classesToApply.length) {
      output += `\n@mixin ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }

  return {
    result: output,
    warnings: allWarnings,
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
  const namingContext = createNamingContext(tailwind4NamingConfig);

  const { selectors, warnings: variantWarnings } = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  // Merge warnings from filterStyleTokens and convertVariantGroupBy
  const allWarnings = [...warnings, ...variantWarnings];

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
    warnings: allWarnings,
    errors,
  };
};
