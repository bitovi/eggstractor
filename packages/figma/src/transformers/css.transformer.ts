import { StyleToken, TokenCollection, TransformerResult, VariableToken } from '../types';
import { deduplicateMessages, groupBy } from './utils';
import { createNamingContext, rem } from '../utils';
import { convertVariantGroupBy } from './variants';
import { Transformer } from './types';

const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  // Use token.value (which contains variable references) instead of rawValue
  // This ensures semantic variables are referenced, not their resolved values
  const baseValue = token.value || token.rawValue;
  if (!baseValue) {
    return { [token.property]: '' };
  }

  const processedValue = token.valueType === 'px' ? rem(baseValue) : baseValue;

  return {
    [token.property]: processedValue,
  };
};

/**
 * Transforms a token collection to CSS variables and classes.
 *
 * @param tokens - The token collection to transform
 * @param useCombinatorialParsing - Whether to use combinatorial parsing for variants
 * @param _generateSemantics - (Not used in CSS transformer)
 * @param outputMode - Determines what to output:
 *   - 'variables': Only CSS custom properties in :root (no classes)
 *   - 'components': Only CSS classes from style tokens (no variables)
 *   - 'all': Both CSS variables and classes (default behavior)
 * @returns TransformerResult with the generated CSS code
 */
export const transformToCss: Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
  _generateSemantics,
  outputMode = 'all',
): TransformerResult => {
  let output = '/* Generated CSS */';

  // Deduplicate warnings and errors
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style'),
  );

  // For 'variables' mode, output CSS variables
  if (outputMode === 'variables') {
    const variableTokens = tokens.tokens.filter(
      (token): token is VariableToken => token.type === 'variable',
    );

    if (variableTokens.length > 0) {
      output += '\n\n:root {\n';
      for (const token of variableTokens) {
        const varName = `--${token.name}`;
        const rawValue = token.rawValue ?? '';
        const value = token.valueType === 'px' ? rem(rawValue) : rawValue;
        output += `  ${varName}: ${value};\n`;
      }
      output += '}\n';
    }

    return {
      result: output,
      warnings,
      errors,
    };
  }

  // For 'components' and 'all' modes, generate CSS classes
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

  const namingContext = createNamingContext();
  const selectors = convertVariantGroupBy(
    tokens,
    variantGroups,
    getClassNamePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  for (const selector of selectors) {
    output += `\n.${selector.key} {\n`;
    Object.entries(selector.styles).forEach(([property, value]) => {
      output += `  ${property}: ${value};\n`;
    });
    output += '}\n';
  }

  return {
    result: output,
    warnings,
    errors,
  };
};
