import { StyleToken, TokenCollection, TransformerResult } from '../types';
import { groupBy } from '../utils/index';
import { deduplicateMessages } from '../utils/error.utils';

export function transformToCss(tokens: TokenCollection): TransformerResult {
  let output = "/* Generated CSS */";
  
  // Deduplicate warnings and errors
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === 'style')
  );

  // Filter for style tokens only
  const styleTokens = tokens.tokens.filter((token): token is StyleToken => 
    token.type === 'style'
  );

  const variantGroups = groupBy(styleTokens, t => t.path.join('_'));
  Object.entries(variantGroups).forEach(([variantPath, groupTokens]) => {
    if (!variantPath) return;
    // Remove properties with zero values and unnecessary defaults
    const uniqueTokens = groupTokens.reduce((acc, token) => {
      const existing = acc.find(t => t.property === token.property);
      if (!existing && token.value !== 'inherit') {
        // Skip zero values for certain properties
        if (['gap', 'padding'].includes(token.property) && 
            (token.value === '0' || token.value === '0px')) {
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

    // Only output class if there are non-inherited properties
    if (uniqueTokens.length > 0) {
      output += `\n.${variantPath} {\n`;
      uniqueTokens.forEach(token => {
        output += `  ${token.property}: ${token.rawValue};\n`;
      });
      output += "}\n";
    }
  });

  return {
    result: output,
    warnings,
    errors
  };
} 