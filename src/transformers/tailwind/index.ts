import { TokenCollection } from '../../types';
import { groupBy } from '../../utils';
import { backToStyleTokens, convertVariantGroupBy } from '../variants-middleware';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';
import { createNamingConvention, NamingContext, getStylePropertyAndValue } from '../helpers/index';

export function transformToTailwindSassClass(collection: TokenCollection) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);
  const parsedStyleTokens = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
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

export function transformToTailwindLayerUtilityClassV4(collection: TokenCollection) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);

  const tailwind4NamingConvention: NamingContext = {
    env: 'tailwind-v4',
    delimiters: {
      pathSeparator: '/',
      afterComponentName: '.',
      variantEqualSign: '_',
      betweenVariants: '.',
    },
    duplicate: (name, count) => `${name}${count}`,
  };

  const namingFunctions = createNamingConvention(tailwind4NamingConvention);

  const parsedStyleTokens = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingFunctions, // Pass the object with both functions
  );

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
