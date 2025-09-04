import { BaseToken } from '../../types';
import { defaultContextConfig, NamingContextConfig } from './naming-context.utils';

export interface NamingContext {
  createName: (
    path: BaseToken['path'],
    propertyNameConflicts?: Record<string, string[]>,
    variants?: Record<string, string>,
  ) => string;
}

export const createNamingContext = (
  partialConfig: NamingContextConfig = defaultContextConfig,
): NamingContext => {
  const config = {
    ...defaultContextConfig,
    ...partialConfig,
    delimiters: { ...defaultContextConfig.delimiters, ...partialConfig.delimiters },
  };

  const nameCountMap = new Map<string, number>();

  // Extract path processing
  const buildBasePath = (path: BaseToken['path']) => {
    const pathSegments = path
      .filter((part) => part.type !== 'COMPONENT')
      .map((part) => part.name.replace(/\s+/g, '-'));

    const segmentsToUse = config.includePageInPath ? pathSegments : pathSegments.slice(1);
    return segmentsToUse.join(config.delimiters.pathSeparator) || '';
  };

  // Extract variant standardization
  const standardizeVariantCombination = (
    path: Array<{ name: string; type: string }>,
    variants: Record<string, string> = {},
  ) => {
    // TODO: handle ROOT
    // if (!variantsCombination || variantsCombination === 'ROOT') {
    //   return '';
    // }

    // NEW: If we have variants object, reconstruct as property=value format
    // if (Object.keys(variants).length) {
    //   const reconstructed = Object.entries(variants)
    //     .map(([prop, val]) => `${prop}=${val}`)
    //     .join('--');

    //   // Use reconstructed format instead of raw variantsCombination
    //   variantsCombination = reconstructed;
    // }
    const variantsCombination = Object.entries(variants)
      .map(([prop, val]) => `${prop}=${val}`)
      .join('--');

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
    createName(path, propertyNameConflicts = {}, variants = {}): string {
      const standardizedVariants = standardizeVariantCombination(path, variants);
      const basePath = buildBasePath(path);

      const variantParts = standardizedVariants.split('--').filter(Boolean) || [];
      const parsedVariants = parseVariantParts(variantParts);

      const processedVariants = parsedVariants
        .map(({ property, value }) => {
          if (value === 'root') return null;

          const cleanValue = value.trim().replace(/\s+/g, '-').toLowerCase();

          // Check if this PROPERTY appears in ANY conflict
          const propertyHasConflicts = property
            ? Object.values(propertyNameConflicts).some((conflictingProperties) =>
                conflictingProperties.includes(property),
              )
            : false;

          // NEW: Special handling for boolean-like values
          const isFalsyBoolean = ['false', 'no'].includes(cleanValue);
          const isTruthyBoolean = ['true', 'yes'].includes(cleanValue);

          if (property) {
            const cleanProperty = property.trim().replace(/\s+/g, '-');

            // For falsy boolean values, ALWAYS prefix (regardless of conflicts)
            if (isFalsyBoolean) {
              return `${cleanProperty}${config.delimiters.variantEqualSign}${cleanValue}`;
            }

            // For truthy boolean values, NEVER prefix (unless there are conflicts)
            if (isTruthyBoolean && !propertyHasConflicts) {
              return cleanValue;
            }

            // For conflicts (including truthy booleans with conflicts), prefix
            if (propertyHasConflicts) {
              return `${cleanProperty}${config.delimiters.variantEqualSign}${cleanValue}`;
            }
          }

          // Default: no prefix for non-boolean values without conflicts
          return cleanValue;
        })
        .filter(Boolean);

      // Build final name
      let newName = basePath;
      if (processedVariants.length) {
        newName +=
          config.delimiters.afterComponentName +
          processedVariants.join(config.delimiters.betweenVariants);
      }

      // Handle duplicates
      const baseNewName = newName;
      const counter = nameCountMap.get(baseNewName) ?? 0;
      if (counter) {
        newName = config.duplicate(baseNewName, counter + 1);
      }
      nameCountMap.set(baseNewName, counter + 1);

      return newName.toLowerCase();
    },
  };
};
