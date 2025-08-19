import { StyleToken, TokenCollection, TransformerResult } from '../types';
import { deduplicateMessages, groupBy } from './utils';
import { rem } from '../utils';
import { convertVariantGroupBy } from './variants-middleware';

const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;

  return {
    [token.property]: value,
  };
};

export function transformToCss(tokens: TokenCollection): TransformerResult {
  let output = '/* Generated CSS */';

  // Deduplicate warnings and errors
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style'),
  );

  // Filter for style tokens only and ensure they have valid values
  const styleTokens = tokens.tokens.filter(
    (token): token is StyleToken =>
      token.type === 'style' &&
      token.value != null &&
      token.value !== '' &&
      token.rawValue != null &&
      token.rawValue !== '',
  );

  const variantGroups = Object.entries(groupBy(styleTokens, (t) => t.name)).reduce(
    (acc, [tokenName, tokens]) => {
      // Remove properties with zero values and unnecessary defaults
      const uniqueTokens = tokens.reduce((acc, token) => {
        const existing = acc.find((t) => t.property === token.property);
        if (!existing && token.value !== 'inherit') {
          // Skip zero values for certain properties
          if (
            ['gap', 'padding'].includes(token.property) &&
            (token.value === '0' || token.value === '0px')
          ) {
            return acc;
          }
          // Skip default values
          if (token.property === 'border-width' && token.value === '1px') {
            return acc;
          }
          acc.push(token);
        }
        return acc;
      }, [] as StyleToken[]);

      if (uniqueTokens.length) {
        acc[tokenName] = uniqueTokens;
      }
      return acc;
    },
    {} as Record<string, StyleToken[]>,
  );

  const classNames = convertVariantGroupBy(tokens, variantGroups, getClassNamePropertyAndValue);

  for (const classNameDefinition of classNames) {
    output += `\n.${classNameDefinition.variantCombinationName} {\n`;
    Object.entries(classNameDefinition.css).forEach(([property, value]) => {
      output += `  ${property}: ${value};\n`;
    });
    output += '}\n';
  }

  return {
    result: output,
    warnings,
    errors,
  };
}
