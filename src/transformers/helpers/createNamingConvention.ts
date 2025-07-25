import { USE_VARIANT_COMBINATION_PARSING } from '../variants';
import { NamingContext, defaultContext } from '../utils';

export const createNamingConvention = (context: NamingContext = defaultContext) => {
  const nameCountMap = new Map<string, number>();

  // Extract path processing
  const buildBasePath = (path: Array<{ name: string; type: string }>) => {
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

    if (USE_VARIANT_COMBINATION_PARSING()) {
      return variantsCombination;
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
    createGroupingKey: (path: Array<{ name: string; type: string }>) => {
      const filteredPath = path.filter((part) => part.type !== 'COMPONENT');
      const pathToUse = context.includePageInPath ? filteredPath : filteredPath.slice(1);
      return pathToUse.map(({ name }) => name.replace(/\s+/g, '-')).join('.');
    },

    createName: (
      path: Array<{ name: string; type: string }>,
      variantsCombination: string,
      propertyNameConflicts?: Record<string, string[]>,
      variants: Record<string, string> = {},
    ) => {
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
          const propertyHasConflicts =
            property &&
            Object.values(propertyNameConflicts || {}).some((conflictingProperties) =>
              conflictingProperties.includes(property),
            );

          if (property && propertyHasConflicts) {
            return `${property}${context.delimiters.variantEqualSign}${cleanValue}`;
          } else {
            return cleanValue;
          }
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
