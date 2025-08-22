import { NamingContext, defaultContext } from '../utils';
import { BaseToken } from '../../types';

export interface NamingFunctions {
  createName: (
    path: BaseToken['path'],
    variantsCombination: string,
    propertyNameConflicts?: Record<string, string[]>,
    variants?: Record<string, string>,
  ) => string;
}

export const createNamingConvention = (
  context: NamingContext = defaultContext,
): NamingFunctions => {
  const nameCountMap = new Map<string, number>();

  // Extract path processing
  const buildBasePath = (path: BaseToken['path']) => {
    const pathSegments = path
      ?.filter((part) => part.type !== 'COMPONENT')
      ?.map((part) => part.name.replace(/\s+/g, '-'));

    const segmentsToUse = context.includePageInPath ? pathSegments : pathSegments?.slice(1);
    return segmentsToUse?.join(context.delimiters.pathSeparator) || '';
  };

  // Extract variant standardization
  const standardizeVariantCombination = (
    variantsCombination: string,
    path?: Array<{ name: string; type: string }>,
    variants: Record<string, string> = {},
  ) => {
    if (!variantsCombination || variantsCombination === 'ROOT') {
      return '';
    }

    // NEW: If we have variants object, reconstruct as property=value format
    if (variants && Object.keys(variants).length > 0) {
      const reconstructed = Object.entries(variants)
        .map(([prop, val]) => `${prop}=${val}`)
        .join('--');

      // Use reconstructed format instead of raw variantsCombination
      variantsCombination = reconstructed;
    }

    // Convert spaces to dashes in all variant parts
    let cleaned = variantsCombination
      .replace(/--and--/g, '--') // Convert --and-- to --
      .replace(/^and--/, '') // Remove leading and--
      .replace(/--and$/, '') // Remove trailing --and
      .replace(/\band\b/g, '') // Remove standalone and
      .replace(/[\s._]/g, '-'); // Handle spaces, dots, underscores

    // Remove path components if provided
    if (path) {
      const pathNames = path
        .filter((part) => part.type !== 'COMPONENT')
        .map((part) => part.name.replace(/\s+/g, '-'));

      pathNames.forEach((pathName) => {
        const regex = new RegExp(
          `\\b${pathName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`,
          'g',
        );
        cleaned = cleaned
          .replace(regex, '')
          .replace(/^--+|--+$/g, '')
          .replace(/--+/g, '--');
      });
    }

    return cleaned;
  };

  // Extract variant parsing
  const parseVariantParts = (parts: string[]) => {
    return parts.map((part) => {
      if (part.includes('=')) {
        const [property, value] = part.split('=');
        return { property: property.toLowerCase(), value: value.toLowerCase() };
      } else {
        return { property: null, value: part.toLowerCase() };
      }
    });
  };

  return {
    createName(path, variantsCombination, propertyNameConflicts = {}, variants = {}): string {
      const standardizedVariants = standardizeVariantCombination(
        variantsCombination,
        path,
        variants,
      );
      const basePath = buildBasePath(path);

      const variantParts = standardizedVariants?.split('--').filter(Boolean) || [];
      const parsedVariants = parseVariantParts(variantParts);

      const processedVariants = parsedVariants
        .map(({ property, value }) => {
          if (value === 'root') return null;

          const cleanValue = value.trim().replace(/\s+/g, '-');
          const cleanProperty = property?.trim().replace(/\s+/g, '-');

          // Check if this PROPERTY appears in ANY conflict
          const propertyHasConflicts =
            property &&
            Object.values(propertyNameConflicts).some((conflictingProperties) =>
              conflictingProperties.includes(property),
            );

          // NEW: Special handling for boolean-like values
          const isFalsyBoolean = ['false', 'no'].includes(cleanValue.toLowerCase());
          const isTruthyBoolean = ['true', 'yes'].includes(cleanValue.toLowerCase());

          if (property) {
            // For falsy boolean values, ALWAYS prefix (regardless of conflicts)
            if (isFalsyBoolean) {
              return `${cleanProperty}${context.delimiters.variantEqualSign}${cleanValue}`; // Use cleanProperty
            }

            // For truthy boolean values, NEVER prefix (unless there are conflicts)
            if (isTruthyBoolean && !propertyHasConflicts) {
              return cleanValue;
            }

            // For conflicts (including truthy booleans with conflicts), prefix
            if (propertyHasConflicts) {
              return `${cleanProperty}${context.delimiters.variantEqualSign}${cleanValue}`; // Use cleanProperty
            }
          }

          // Default: no prefix for non-boolean values without conflicts
          return cleanValue;
        })
        .filter(Boolean);

      // Build final name
      let newName = basePath;
      if (processedVariants.length > 0) {
        newName +=
          context.delimiters.afterComponentName +
          processedVariants.join(context.delimiters.betweenVariants);
      }

      // Handle duplicates
      const baseNewName = newName;
      let counter = nameCountMap.get(baseNewName) || 0;
      if (counter > 0) {
        newName = context.duplicate!(baseNewName, counter + 1);
      }
      nameCountMap.set(baseNewName, counter + 1);

      return newName.toLowerCase();
    },
  };
};
