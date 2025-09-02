import { NonNullableStyleToken, TokenCollection } from '../../types';
import { groupBy } from '../utils/group-by.utils';
import { backToStyleTokens, convertVariantGroupBy } from '../variants-middleware';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';
import { getStylePropertyAndValue } from '../utils';
import { createNamingContext, tailwind4NamingConfig } from '../../utils';

export function transformToTailwindSassClass(
  collection: TokenCollection,
  useCombinatorialParsing: boolean = true,
) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token: NonNullableStyleToken) => token.name);
  const namingContext = createNamingContext();
  const parsedStyleTokens = convertVariantGroupBy(
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
  const formattedStyleTokens = backToStyleTokens(parsedStyleTokens).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

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

export function transformToTailwindLayerUtilityClassV4(
  collection: TokenCollection,
  useCombinatorialParsing: boolean = true,
) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);

  const namingContext = createNamingContext(tailwind4NamingConfig);

  const parsedStyleTokens = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = backToStyleTokens(parsedStyleTokens).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  let output = '/* Generated Tailwind Utilities */\n';

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
