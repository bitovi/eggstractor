import { TokenCollection } from '../../types';
import { groupBy } from '../../utils';
import { deduplicateMessages } from '../../utils/error.utils';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';

export function transformToTailwindSassClass(collection: TokenCollection) {
  const styleTokens = filterStyleTokens(collection);
  const { warnings, errors } = deduplicateMessages(styleTokens);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);

  let output = '/* Generated Tailwind-SCSS */';

  for (const [variantPath, tokens] of Object.entries(groupedTokens)) {
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

  for (const [variantPath, tokens] of Object.entries(groupedTokens)) {
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
