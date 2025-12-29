import { TokenCollection, StyleToken, TransformerResult } from '../types';
import { sanitizeName, rem, createNamingContext, generateScssVariablesWithModes } from '../utils';
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

const getMixinPropertyAndValue = (
  token: StyleToken,
  primitiveVariables: Map<string, string>,
): Record<string, string> => {
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

  let baseValue = token.value ? (token.valueType === 'px' ? rem(token.value) : token.value) : '';

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

  // in SCSS negated variables are a parsing warning unless parenthesized
  const processedValue = baseValue
    .replace(/-\$(\w|-)+/g, (match) => `(${match})`)
    .replace(/\$(?!-)([^a-zA-Z])/g, (_, char) => `$v${char}`);
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

  const namingContext = createNamingContext();
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
