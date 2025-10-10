import { GeneratorToken } from '../tailwind/generators';
import { convertVariantGroupBy } from './convert-variant-group-by';

/**
 * @deprecated shouldn't be required, only here for backwards compatibility
 * Used specifically for tailwind styles using Generators.
 */
export const convertToGeneratorTokens = (
  parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>,
): { variantPath: string; tokens: GeneratorToken[] }[] => {
  return parsedStyleTokens.map((parsedStyleToken) => {
    const tokens = Object.entries(parsedStyleToken.styles).map(([property, rawValue]) => ({
      property,
      rawValue,
      // Preserve the path for context-aware generators
      path: parsedStyleToken.path,
    }));

    return {
      variantPath: parsedStyleToken.key,
      tokens,
    };
  });
};
