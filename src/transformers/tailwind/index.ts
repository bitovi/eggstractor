import { StyleToken, TokenCollection } from '../../types';
import { groupBy } from '../../utils';
import { deduplicateMessages } from '../../utils/error.utils';
import { backToStyleTokens, convertVariantGroupBy } from '../variants-middleware';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';

const createTailwind4NamingConvention = (context?: NamingContext) => {
  const nameCountMap = new Map<string, number>();
  const valueCountMap = new Map<string, number>(); // Track value usage across properties

  return (path: Array<{ name: string; type: string }>, variantsCombination: string) => {
    // Extract base path
    const basePath =
      path
        ?.filter((part) => part.type !== 'COMPONENT')
        ?.map((part) => part.name.replace(/\s+/g, '-'))
        ?.join(ctx.delimiters.pathSeparator) || '';

    // Process variants
    const variantParts = variantsCombination.split('--').filter(Boolean);

    // First pass: count value occurrences
    const valueOccurrences = new Map<string, number>();
    variantParts.forEach((part) => {
      if (part.includes('-')) {
        const segments = part.split('-');
        if (segments.length > 2) {
          const value = segments.slice(1).join('-');
          valueOccurrences.set(value, (valueOccurrences.get(value) || 0) + 1);
        }
      }
    });

    // Second pass: generate names based on conflicts
    const processedVariants = variantParts.map((part) => {
      if (part.includes('-')) {
        const segments = part.split('-');
        if (segments.length > 2) {
          const property = segments[0];
          const value = segments.slice(1).join('-');

          // Use property_value format only if value appears multiple times
          if (valueOccurrences.get(value)! > 1) {
            return `${property}${ctx.delimiters.variantEqualSign}${value}`;
          }

          // Otherwise just use the value
          return value;
        }
      }
      return part.replace(/\s+/g, '-');
    });

    // Rest of your naming logic...
    let newName = basePath;
    if (processedVariants.length > 0) {
      newName +=
        ctx.delimiters.afterComponentName + processedVariants.join(ctx.delimiters.betweenVariants);
    }

    // Handle duplicates
    const baseNewName = newName;
    let counter = nameCountMap.get(baseNewName) || 0;
    if (counter > 0) {
      newName = ctx.duplicate!(baseNewName, counter + 1);
    }
    nameCountMap.set(baseNewName, counter + 1);

    return newName.toLowerCase();
  };
};

const getStylePropertyAndValue = (token: StyleToken): Record<string, string> => {
  const output: Record<string, string> = {
    [token.property]: token.rawValue!,
  };

  return output;
};

export function transformToTailwindSassClass(collection: TokenCollection) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);
  const parsedStyleTokens = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
  );

  let output = '/* Generated Tailwind-SCSS */';

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = backToStyleTokens(parsedStyleTokens).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  for (const { variantPath, tokens } of formattedStyleTokens) {
    const classesToApply = createTailwindClasses(tokens);

    if (classesToApply.length) {
      output += `\n@mixin ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }

  return {
    result: output,
    warnings,
    errors,
  };
}

export function transformToTailwindLayerUtilityClassV4(collection: TokenCollection) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);

  let output = '/* Generated Tailwind Utilities */\n';
  const namingFunction = createTailwind4NamingConvention();

  const parsedStyleTokens = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingFunction,
  );

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = backToStyleTokens(parsedStyleTokens).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  for (const { variantPath, tokens } of formattedStyleTokens) {
    const classesToApply = createTailwindClasses(tokens);
    if (classesToApply.length) {
      output += `\n@utility ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }
  return {
    result: output,
    warnings,
    errors,
  };
}
