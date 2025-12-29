import { StyleToken, TokenCollection, TransformerResult } from '../types';
import { deduplicateMessages, groupBy } from './utils';
import { createNamingContext, rem, generateCssVariablesWithModes } from '../utils';
import { convertVariantGroupBy } from './variants';
import { Transformer } from './types';

const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  // Use token.value (which contains variable references) instead of rawValue
  // This ensures semantic variables are referenced, not their resolved values
  let baseValue = token.value || token.rawValue;
  if (!baseValue) {
    return { [token.property]: '' };
  }

  // Convert variable references to CSS custom properties (var(--variable))
  // Property-aware approach: different properties have different patterns

  // For border property, format is: <width> <style> <color>
  // The middle value (style) is always a CSS keyword like 'solid', 'dashed', etc.
  if (token.property === 'border') {
    const parts = baseValue.split(/\s+/);
    if (parts.length === 3) {
      const [width, style, color] = parts;
      // Width and color might be variables, style is always a keyword
      const processedWidth = isVariableReference(width) ? `var(--${width})` : width;
      const processedColor = isVariableReference(color) ? `var(--${color})` : color;
      baseValue = `${processedWidth} ${style} ${processedColor}`;
    }
  } else {
    // For other properties, check each part individually
    baseValue = baseValue
      .split(/\s+/)
      .map((part) => (isVariableReference(part) ? `var(--${part})` : part))
      .join(' ');
  }

  const processedValue = token.valueType === 'px' ? rem(baseValue) : baseValue;

  return {
    [token.property]: processedValue,
  };
};

/**
 * Determines if a string token is a variable reference vs a CSS value/keyword
 * Variables: alphanumeric with hyphens/underscores, starts with letter, contains hyphen
 * Not variables: CSS keywords, literals with units, numbers, etc.
 */
const isVariableReference = (part: string): boolean => {
  // CSS keywords that should never be treated as variables
  const cssKeywords = new Set([
    'inherit',
    'initial',
    'unset',
    'auto',
    'none',
    'normal',
    'solid',
    'dashed',
    'dotted',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
    'hidden',
    'visible',
    'collapse',
    'transparent',
    'currentColor',
  ]);

  if (cssKeywords.has(part)) {
    return false;
  }

  // Must look like a variable name: starts with letter, alphanumeric with hyphens/underscores
  // Must contain at least one hyphen or underscore (to distinguish from single-word values)
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(part) && /[-_]/.test(part);
};

/**
 * Transforms a token collection to CSS variables and classes.
 *
 * @param tokens - The token collection to transform
 * @param useCombinatorialParsing - Whether to use combinatorial parsing for variants
 * @param _generateSemantics - (Not used in CSS transformer)
 * @param outputMode - Determines what to output:
 *   - 'variables': Only CSS custom properties in :root and [data-theme] blocks (with multi-mode support)
 *   - 'components': Only CSS classes from style tokens (no variables)
 *   - 'all': Both CSS variables (with multi-mode) and classes (default behavior)
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

  // For 'variables' mode, output CSS variables with multi-mode support
  if (outputMode === 'variables') {
    const variableCss = generateCssVariablesWithModes(tokens);

    if (variableCss) {
      output += '\n\n' + variableCss;
    } else {
      output += '\n\n/* No variables found */';
    }

    return {
      result: output,
      warnings,
      errors,
    };
  }

  // For 'all' mode, include variables with multi-mode support
  if (outputMode === 'all') {
    const variableCss = generateCssVariablesWithModes(tokens);
    if (variableCss) {
      output += '\n\n' + variableCss;
    }
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
