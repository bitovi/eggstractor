import { TokenCollection, StyleToken, TransformerResult } from '../types';
import {
  sanitizeName,
  rem,
  createNamingContext,
  generateScssVariablesWithModes,
  defaultContextConfig,
} from '../utils';
import { deduplicateMessages, groupBy } from './utils';
import { convertVariantGroupBy } from './variants';
import type { Transformer } from './types';

const getSCSSVariableName = (variableName: string): string => {
  let scssVariableName = variableName;

  if (!/^[a-zA-Z]/.test(scssVariableName)) {
    scssVariableName = 'v' + scssVariableName;
  }

  return `$${scssVariableName}`;
};

/**
 * Converts StyleToken to SCSS property/value pair.
 *
 * @deprecated TECHNICAL DEBT: String parsing with keyword lists is fragile and unmaintainable.
 * This function maintains a large Set of CSS keywords to distinguish them from variable names.
 * The keyword list is incomplete and requires manual updates. The proper solution requires
 * restructuring the token pipeline to use structured value types. See:
 * https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+Token+Pipeline+ROUGH+DRAFT
 *
 * Current workaround: Processors can provide pre-formatted scssValue to bypass parsing.
 * Only border processor currently does this.
 */
const getMixinPropertyAndValue = (
  token: StyleToken,
  primitiveVariables: Map<string, string>,
): Record<string, string> => {
  // Use pre-formatted scssValue if available (eliminates parsing logic)
  if (token.scssValue) {
    const processedValue = token.valueType === 'px' ? rem(token.scssValue) : token.scssValue;
    return { [token.property]: processedValue };
  }

  if (token.property === 'fills' && token?.rawValue?.includes('gradient')) {
    // Only use CSS variables if the token has associated variables
    if (token.variables && token.variables.length > 0) {
      const gradientName = `gradient-${sanitizeName(token.name)}`;
      return {
        [token.property]: `$var(--${gradientName}, #{${getSCSSVariableName(gradientName)}})`,
      };
    }

    // Use the raw value directly if no variables are involved
    const value = token.rawValue
      ? token.valueType === 'px'
        ? rem(token.rawValue)
        : token.rawValue
      : '';

    // output += ` ${token.property}: ${value};\n`;
    return { [token.property]: value };
  }

  // For non-gradient tokens, convert variable names to SCSS format with $ prefix
  // Handle both single variables and compound values like "0.5rem spacing-2"
  // CSS keywords and common font names that should NOT be treated as variables
  const cssKeywords = new Set([
    // CSS Keywords
    'inherit',
    'initial',
    'unset',
    'auto',
    'none',
    'normal',
    'flex',
    'grid',
    'block',
    'inline',
    'inline-block',
    'row',
    'column',
    'row-reverse',
    'column-reverse',
    'center',
    'flex-start',
    'flex-end',
    'space-between',
    'space-around',
    'space-evenly',
    'baseline',
    'stretch',
    'start',
    'end',
    'wrap',
    'nowrap',
    'wrap-reverse',
    'bold',
    'bolder',
    'lighter',
    'italic',
    'oblique',
    'underline',
    'overline',
    'line-through',
    'uppercase',
    'lowercase',
    'capitalize',
    'left',
    'right',
    'justify',
    'solid',
    'dashed',
    'dotted',
    'double',
    'hidden',
    'visible',
    'collapse',
    'absolute',
    'relative',
    'fixed',
    'sticky',
    'static',
    'fit-content',
    'min-content',
    'max-content',
    'inset',
    // Common font families
    'Inter',
    'Roboto',
    'Arial',
    'Helvetica',
    'sans-serif',
    'serif',
    'monospace',
    'Georgia',
    'Verdana',
    'Times',
    'Courier',
    'Monaco',
    'Consolas',
  ]);

  let baseValue = '';
  if (token.value) {
    // Split on whitespace and add $ prefix to variable names
    baseValue = token.value
      .split(/\s+/)
      .map((part) => {
        // Skip CSS keywords and font names - these are CSS values, not variables
        if (cssKeywords.has(part)) {
          return part;
        }
        // Handle negative variable references: -variable-name → (-$variable-name)
        // Check for trailing punctuation (comma, semicolon, etc.)
        const negativeMatchWithPunct = part.match(/^(-[a-z][a-zA-Z0-9_-]*)([,;)]*)$/);
        if (negativeMatchWithPunct && negativeMatchWithPunct[1].includes('-', 1)) {
          const varName = negativeMatchWithPunct[1].substring(1); // Remove leading -
          const punct = negativeMatchWithPunct[2];
          return `(-$${varName})${punct}`;
        }
        // Check if this part is a positive variable reference
        // Must start with lowercase letter AND contain at least one hyphen or underscore
        const positiveMatchWithPunct = part.match(/^([a-z][a-zA-Z0-9_-]*)([,;)]*)$/);
        if (
          (positiveMatchWithPunct && positiveMatchWithPunct[1].includes('-')) ||
          (positiveMatchWithPunct && positiveMatchWithPunct[1].includes('_'))
        ) {
          const varName = positiveMatchWithPunct[1];
          const punct = positiveMatchWithPunct[2];
          return `$${varName}${punct}`;
        }
        return part;
      })
      .join(' ');

    // Apply rem conversion if needed
    if (token.valueType === 'px') {
      baseValue = rem(baseValue);
    }
  }

  // Replace color values with variable references if they exist
  // Only do this if the baseValue doesn't already contain variable references (e.g., $variable-name)
  if (
    (token.property === 'color' || token.property === 'background' || token.property === 'fills') &&
    !baseValue.includes('$')
  ) {
    primitiveVariables.forEach((value, colorName) => {
      // Simply replace exact matches - color values like #00464a or rgba(...) won't be
      // part of other values since they have distinct formats
      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedValue, 'g');
      baseValue = baseValue.replace(regex, `${getSCSSVariableName(colorName)}`);
    });
  }

  // Fix SCSS variables that start with invalid characters by prefixing with 'v'
  // NOTE: Negative variables are already wrapped in parens by the logic above (lines 151-155)
  // so we don't need to wrap them again here
  const processedValue = baseValue.replace(/\$(?!-)([^a-zA-Z])/g, (_, char) => `$v${char}`);
  return { [token.property]: processedValue };
};

/**
 * Transforms a token collection to SCSS variables and mixins.
 *
 * @param tokens - The token collection to transform
 * @param useCombinatorialParsing - Whether to use combinatorial parsing for variants
 * @param _generateSemantics - (Not used in SCSS transformer)
 * @param outputMode - Determines what to output:
 *   - 'variables': Only SCSS variables (primitives, semantics, gradients) - no mixins
 *   - 'components': SCSS variables + mixins (default behavior)
 *   - 'all': SCSS variables + mixins (default behavior)
 * @returns TransformerResult with the generated SCSS code
 */
export const transformToScss: Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
  _generateSemantics,
  outputMode = 'all',
  includePageInPath = true,
): TransformerResult => {
  let output = '';

  // Deduplicate warnings and errors from style tokens only
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style'),
  );

  // Check if we have multi-mode tokens
  const variableTokens = tokens.tokens.filter((token) => token.type === 'variable');
  const hasMultiMode = variableTokens.some(
    (token) => 'modeId' in token && 'modes' in token && 'modeValues' in token,
  );

  // If we have multi-mode tokens, use the new hybrid CSS custom properties + SCSS variables approach
  if (hasMultiMode) {
    output += generateScssVariablesWithModes(tokens);
    if (output && !output.endsWith('\n\n')) {
      output += '\n';
    }
  } else {
    // Single-mode: use traditional SCSS variables only
    // Separate primitive and semantic variables
    const primitiveVariables = new Map<string, string>();
    const semanticVariables = new Map<string, string>();

    tokens.tokens.forEach((token) => {
      if (token.type === 'variable') {
        const sanitizedName = sanitizeName(token.name);

        if (token.metadata?.variableTokenType === 'primitive') {
          const rawValue = token.rawValue;
          if (rawValue) {
            const value = token.valueType === 'px' ? rem(rawValue) : rawValue;
            primitiveVariables.set(sanitizedName, value);
          }
        } else if (token.metadata?.variableTokenType === 'semantic' && token.primitiveRef) {
          // For semantic variables, reference the primitive variable
          const primitiveRefName = sanitizeName(token.primitiveRef);
          semanticVariables.set(sanitizedName, getSCSSVariableName(primitiveRefName));
        }
      }
    });

    // Deduplicate: if a variable appears in both primitive and semantic,
    // remove it from semantic section (primitives take precedence)
    semanticVariables.forEach((_, name) => {
      if (primitiveVariables.has(name)) {
        //TODO: EGG-113, review variable functions while adding functionality.
        console.warn(
          `Variable "${name}" is defined as both primitive and semantic. Removing semantic definition. This probably shoudn't be happening.`,
        );
        semanticVariables.delete(name);
      }
    });

    // Output primitive variables first
    if (primitiveVariables.size > 0) {
      output += '// Primitive SCSS Variables\n';
      primitiveVariables.forEach((value, name) => {
        output += `${getSCSSVariableName(name)}: ${value};\n`;
      });
    }

    // Output semantic variables
    if (semanticVariables.size > 0) {
      if (primitiveVariables.size > 0) {
        output += '\n';
      }
      output += '// Semantic SCSS Variables\n';
      semanticVariables.forEach((value, name) => {
        output += `${getSCSSVariableName(name)}: ${value};\n`;
      });
    }
  }

  // For gradient variables, we need to build the primitiveVariables map for replacement
  // (needed regardless of single/multi-mode)
  const primitiveVariablesForGradients = new Map<string, string>();
  tokens.tokens.forEach((token) => {
    if (token.type === 'variable' && token.metadata?.variableTokenType === 'primitive') {
      const sanitizedName = sanitizeName(token.name);
      const rawValue = token.rawValue;
      if (rawValue) {
        const value = token.valueType === 'px' ? rem(rawValue) : rawValue;
        primitiveVariablesForGradients.set(sanitizedName, value);
      }
    }
  });

  // Then collect and output gradient variables
  const gradientVariables = new Map<string, StyleToken>();
  tokens.tokens.forEach((token) => {
    if (
      token.type === 'style' &&
      token.property === 'fills' &&
      token.rawValue?.includes('gradient')
    ) {
      const name = `gradient-${sanitizeName(token.name)}`;
      gradientVariables.set(name, token);
    }
  });

  if (gradientVariables.size > 0) {
    output += '\n// Generated Gradient Variables\n';
  }

  // Output gradient variables
  gradientVariables.forEach((token, name) => {
    // Replace color values with variable references if they exist
    let gradientValue = token.rawValue ?? '';
    primitiveVariablesForGradients.forEach((value, colorName) => {
      gradientValue = gradientValue.replace(value, `${getSCSSVariableName(colorName)}`);
    });
    if (gradientValue) {
      output += `#{${getSCSSVariableName(name)}}: ${gradientValue};\n`;
    }
  });

  // If outputMode is 'variables', skip mixin generation
  if (outputMode === 'variables') {
    return {
      result: output,
      warnings,
      errors,
    };
  }

  // Generate mixins section (for 'components' and 'all' modes)
  output += '\n// Generated SCSS Mixins\n';

  // Filter for style tokens and group by path
  const styleTokens = tokens.tokens.filter((token): token is StyleToken => token.type === 'style');

  const variantGroups = Object.entries(groupBy(styleTokens, (t) => t.name)).reduce(
    (acc, [tokenName, tokens]) => {
      const filteredTokens = sortAndDedupeTokens(tokens);
      if (filteredTokens.length) {
        acc[tokenName] = filteredTokens;
      }
      return acc;
    },
    {} as Record<string, StyleToken[]>,
  );

  const namingContext = createNamingContext({
    ...defaultContextConfig,
    includePageInPath,
  });
  const selectors = convertVariantGroupBy(
    tokens,
    variantGroups,
    (token) => getMixinPropertyAndValue(token, primitiveVariablesForGradients),
    namingContext,
    useCombinatorialParsing,
  );

  for (const selector of selectors) {
    output += `@mixin ${selector.key} {\n`;
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

// Helper function to sort and dedupe tokens
function sortAndDedupeTokens(tokens: StyleToken[]): StyleToken[] {
  const layoutProperties = [
    'display',
    'flex-direction',
    'align-items',
    'gap',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
  ];

  // Filter out tokens with empty or null values first
  const validTokens = tokens.filter(
    (token) =>
      token.value !== null &&
      token.value !== undefined &&
      token.value !== '' &&
      token.rawValue !== null &&
      token.rawValue !== undefined &&
      token.rawValue !== '',
  );

  const sortedTokens = validTokens.sort((a, b) => {
    const aIndex = layoutProperties.indexOf(a.property);
    const bIndex = layoutProperties.indexOf(b.property);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sortedTokens.reduce((acc, token) => {
    const existingIndex = acc.findIndex((t) => t.property === token.property);
    if (existingIndex !== -1) {
      acc[existingIndex] = token;
    } else {
      acc.push(token);
    }
    return acc;
  }, [] as StyleToken[]);
}
