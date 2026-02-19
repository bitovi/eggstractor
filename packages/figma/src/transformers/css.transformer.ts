import { StyleToken, TokenCollection, TransformerResult } from '../types';
import { deduplicateMessages, groupBy } from './utils';
import { createNamingContext, rem, generateCssVariablesWithModes } from '../utils';
import { convertVariantGroupBy } from './variants';
import { Transformer } from './types';

/**
 * Converts StyleToken to CSS property/value pair.
 *
 * @deprecated TECHNICAL DEBT: String parsing is fragile and loses type information.
 * This function tries to guess which parts of a compound value (e.g., "0.5rem solid color-primary")
 * are variables vs CSS keywords. The proper solution requires restructuring the entire token pipeline
 * to use structured value types throughout. See:
 * https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+Token+Pipeline+ROUGH+DRAFT
 *
 * Current workaround: Processors can provide pre-formatted cssValue to bypass parsing.
 * Only border processor currently does this.
 */
const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  // Use pre-formatted cssValue if available (eliminates parsing logic)
  if (token.cssValue) {
    const processedValue = token.valueType === 'px' ? rem(token.cssValue) : token.cssValue;
    return { [token.property]: processedValue };
  }

  // Fall back to parsing token.value for backward compatibility
  // Use token.value (which contains variable references) instead of rawValue
  // This ensures semantic variables are referenced, not their resolved values
  let baseValue = token.value || token.rawValue;
  if (!baseValue) {
    return { [token.property]: '' };
  }

  // Convert variable references to CSS custom properties (var(--variable))
  // TODO(TECHNICAL-DEBT): This generic parsing is brittle and will incorrectly wrap
  // CSS keywords as variables (e.g., "solid" → "var(--solid)"). Properties with
  // compound values should use the cssValue workaround (like border processor does)
  // or wait for the full pipeline refactor to structured types. See:
  // https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+Token+Pipeline+ROUGH+DRAFT
  baseValue = baseValue
    .split(/\s+/)
    .map((part) => (isVariableReference(part) ? `var(--${part})` : part))
    .join(' ');

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
  const { selectors, warnings: variantWarnings } = convertVariantGroupBy(
    tokens,
    variantGroups,
    getClassNamePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  // Merge variant warnings with existing warnings
  const allWarnings = [...(warnings || []), ...variantWarnings];

  for (const selector of selectors) {
    output += `\n.${selector.key} {\n`;
    Object.entries(selector.styles).forEach(([property, value]) => {
      output += `  ${property}: ${value};\n`;
    });
    output += '}\n';
  }

  return {
    result: output,
    warnings: allWarnings,
    errors,
  };
};
