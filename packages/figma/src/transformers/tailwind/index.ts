import { NonNullableStyleToken, TokenCollection } from '../../types';
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
} from '../../utils';
import { Transformer } from '../types';

export const transformToTailwindSassClass: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
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

  let output = generateThemeDirective(collection);

  // Build dynamic theme tokens from ALL variable tokens (both primitive and semantic)
  // so that style tokens can reference either type
  const variableTokens = collection.tokens.filter((token) => token.type === 'variable');

  const dynamicThemeTokens = buildDynamicThemeTokens(variableTokens);

  output += '\n\n/* Generated Tailwind Utilities */\n';

  for (const { variantPath, tokens } of formattedStyleTokens) {
    // Pass dynamic theme tokens to the generator
    const classesToApply = createTailwindClasses(tokens, dynamicThemeTokens);
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
