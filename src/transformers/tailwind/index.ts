import { StyleToken, TokenCollection } from '../../types';
import { groupBy } from '../../utils';
import { deduplicateMessages } from '../../utils/error.utils';
import { backToStyleTokens, convertVariantGroupBy } from '../variants-middleware';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';

const getStylePropertyAndValue = (token: StyleToken): Record<string, string> => {
  const output: Record<string, string> = {
    [token.property]: token.rawValue!,
  };

  return output;
};

export function transformToTailwindSassClass(collection: TokenCollection) {
  const styleTokens = filterStyleTokens(collection);
  const { warnings, errors } = deduplicateMessages(styleTokens);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);
  const parsedStyleTokens = convertVariantGroupBy(collection, groupedTokens, getStylePropertyAndValue);

  let output = '/* Generated Tailwind-SCSS */';

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = backToStyleTokens(parsedStyleTokens).sort((a, b) => a.variantPath.localeCompare(b.variantPath));;

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
}

export function transformToTailwindLayerUtilityClassV4(collection: TokenCollection) {
  const styleTokens = filterStyleTokens(collection);
  const { warnings, errors } = deduplicateMessages(styleTokens);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);

  let output = '/* Generated Tailwind Utilities */\n';

  const parsedStyleTokens = convertVariantGroupBy(collection, groupedTokens, getStylePropertyAndValue);

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = backToStyleTokens(parsedStyleTokens).sort((a, b) => a.variantPath.localeCompare(b.variantPath));;

  for (const { variantPath, tokens } of formattedStyleTokens) {
    const classesToApply = createTailwindClasses(tokens);
    if (classesToApply.length) {
      output += `\n@utility ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }
  return {
    result: output,
    warnings,
    errors,
  };
}
