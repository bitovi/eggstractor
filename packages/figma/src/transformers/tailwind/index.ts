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

export const transformToTailwindSassClass: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  _config,
) => {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token: NonNullableStyleToken) => token.name);
  const namingContext = createNamingContext();
  const selectors = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

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
    warnings,
    errors,
  };
};

export const transformToTailwindLayerUtilityClassV4: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  generateSemantics = true, // TODO: Remove this default once UI is updated
) => {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);
  const namingContext = createNamingContext(tailwind4NamingConfig);

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

  // Generate the @theme directive
  // When generateSemantics is true, exclude semantic colors from @theme (they go in :root)
  const themeDirective = generateThemeDirective(collection, generateSemantics);
  const variableTokens = collection.tokens.filter(
    (token): token is VariableToken => token.type === 'variable',
  );
  // When generateSemantics is true, exclude semantic colors from dynamic theme mapping
  const dynamicThemeTokens = buildDynamicThemeTokens(variableTokens, generateSemantics);

  let output = themeDirective;

  // Generate custom semantic color utilities (before component utilities)
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
