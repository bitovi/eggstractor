import { TokenCollection, StyleToken } from '../types';
import Utils from '../utils';

export function transformToScss(tokens: TokenCollection): string {
  let output = "// Generated SCSS Variables\n";

  // First, collect and output color variables
  const colorVariables = new Map<string, string>();
  tokens.tokens.forEach(token => {
    if (token.type === 'variable' && token.property === 'background') {
      // Check if it's a color value (not a gradient)
      if (token.rawValue.startsWith('#') || token.rawValue.startsWith('rgba')) {
        colorVariables.set(Utils.sanitizeName(token.name), token.rawValue);
      }
    }
  });

  // Output color variables
  colorVariables.forEach((value, name) => {
    output += `$${name}: ${value};\n`;
  });

  output += "\n// Generated Gradient Variables\n";
  
  // Then collect and output gradient variables
  const gradientVariables = new Map<string, StyleToken>();
  tokens.tokens.forEach(token => {
    if (token.type === 'style' && 
        token.property === 'background' && 
        (token.rawValue.includes('gradient'))) {
      const name = `gradient-${Utils.sanitizeName(token.name)}`;
      gradientVariables.set(name, token);
    }
  });

  // Output gradient variables
  gradientVariables.forEach((token, name) => {
    // Replace color values with variable references if they exist
    let gradientValue = token.rawValue;
    colorVariables.forEach((value, colorName) => {
      gradientValue = gradientValue.replace(value, `$${colorName}`);
    });
    output += `$${name}: ${gradientValue};\n`;
  });

  // Generate mixins section
  output += "\n// Generated SCSS Mixins\n";

  // Filter for style tokens and group by path
  const styleTokens = tokens.tokens.filter((token): token is StyleToken => 
    token.type === 'style'
  );

  const variantGroups = Utils.groupBy(styleTokens, t => t.path.join('_'));

  Object.entries(variantGroups).forEach(([variantPath, groupTokens]) => {
    if (!variantPath) return;

    // Sort and dedupe tokens as before...
    const uniqueTokens = sortAndDedupeTokens(groupTokens as StyleToken[]);

    if (uniqueTokens.length > 0) {
      output += `@mixin ${variantPath}\n`;
      uniqueTokens.forEach(token => {
        if (token.property === 'background' && token.rawValue.includes('gradient')) {
          // Only use CSS variables if the token has associated variables
          if (token.variables && token.variables.length > 0) {
            const gradientName = `gradient-${Utils.sanitizeName(token.name)}`;
            output += ` ${token.property}: var(--${gradientName}, #{$${gradientName}});\n`;
          } else {
            // Use the raw value directly if no variables are involved
            output += ` ${token.property}: ${token.rawValue};\n`;
          }
        } else {
          output += ` ${token.property}: ${token.value};\n`;
        }
      });
      output += "\n";
    }
  });

  return output;
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
    'padding-left'
  ];

  const sortedTokens = tokens.sort((a, b) => {
    const aIndex = layoutProperties.indexOf(a.property);
    const bIndex = layoutProperties.indexOf(b.property);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sortedTokens.reduce((acc, token) => {
    const existingIndex = acc.findIndex(t => t.property === token.property);
    if (existingIndex !== -1) {
      acc[existingIndex] = token;
    } else {
      acc.push(token);
    }
    return acc;
  }, [] as StyleToken[]);
}