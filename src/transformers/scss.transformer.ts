import { TokenCollection, StyleToken, TransformerResult } from '../types';
import { sanitizeName, rem, createNamingContext } from '../utils';
import { deduplicateMessages, groupBy } from './utils';
import { convertVariantGroupBy } from './variants-middleware';

const getMixinPropertyAndValue = (token: StyleToken): Record<string, string> => {
  if (token.property === 'fills' && token?.rawValue?.includes('gradient')) {
    // Only use CSS variables if the token has associated variables
    if (token.variables && token.variables.length > 0) {
      const gradientName = `gradient-${sanitizeName(token.name)}`;
      return { [token.property]: `$var(--${gradientName}, #{$${gradientName}})` };
    }

    // Use the raw value directly if no variables are involved
    const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
    // output += ` ${token.property}: ${value};\n`;
    return { [token.property]: value };
  }

  const baseValue = token.valueType === 'px' ? rem(token.value!) : token.value;
  // in SCSS negated variables are a parsing warning unless parenthesized
  const processedValue = baseValue?.replace(/-\$(\w|-)+/g, (match) => `(${match})`);

  return { [token.property]: processedValue! };
};

export function transformToScss(
  tokens: TokenCollection,
  useCombinatorialParsing: boolean = true,
): TransformerResult {
  let output = '';

  // Deduplicate warnings and errors from style tokens only
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style'),
  );

  // First, collect and output color variables
  const colorVariables = new Map<string, string>();
  tokens.tokens.forEach((token) => {
    if (token.type === 'variable') {
      const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
      colorVariables.set(sanitizeName(token.name), value);
    }
  });

  if (colorVariables.size > 0) {
    output += '// Generated SCSS Variables\n';
  }

  // Output color variables
  colorVariables.forEach((value, name) => {
    output += `$${name}: ${value};\n`;
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
    colorVariables.forEach((value, colorName) => {
      gradientValue = gradientValue.replace(value, `$${colorName}`);
    });
    if (gradientValue) {
      output += `$${name}: ${gradientValue};\n`;
    }
  });

  // Generate mixins section
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
  const mixins = convertVariantGroupBy(
    tokens,
    variantGroups,
    getMixinPropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  for (const mixin of mixins) {
    output += `@mixin ${mixin.variantCombinationName} {\n`;
    Object.entries(mixin.css).forEach(([property, value]) => {
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
