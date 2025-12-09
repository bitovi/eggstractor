import { GeneratorToken } from '../tailwind/generators';
import { convertVariantGroupBy } from './convert-variant-group-by';
import { StyleToken } from '../../types';

/**
 * @deprecated shouldn't be required, only here for backwards compatibility
 * Used specifically for tailwind styles using Generators.
 */
export const convertToGeneratorTokens = (
  parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>,
): { variantPath: string; tokens: GeneratorToken[] }[] => {
  return parsedStyleTokens.map((parsedStyleToken) => {
    const tokens = Object.entries(parsedStyleToken.styles).map(([property, rawValue]) => {
      // Find the original StyleToken for this property to check for semantic variables
      const styleToken = parsedStyleToken.tokens?.find((t: StyleToken) => t.property === property);
      let semanticVariableName: string | undefined;

      if (styleToken?.variableTokenMapByProperty) {
        const variableToken = styleToken.variableTokenMapByProperty.get(property);
        if (variableToken?.metadata?.variableTokenType === 'semantic') {
          semanticVariableName = variableToken.name;
        }
      }

      return {
        property,
        rawValue,
        // Preserve the path for context-aware generators
        path: parsedStyleToken.path,
        semanticVariableName,
      };
    });

    return {
      variantPath: parsedStyleToken.key,
      tokens,
    };
  });
};
