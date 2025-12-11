import { BaseToken } from '../../types';
import { defaultContextConfig, NamingContextConfig } from './naming-context.utils';

export interface NamingContext {
  createName: (
    path: BaseToken['path'],
    propertyNameConflicts?: Record<string, string[]>,
    variants?: Record<string, string>,
    componentSetId?: string | null,
  ) => string;
}

export const createNamingContext = (
  partialConfig: NamingContextConfig = defaultContextConfig,
): NamingContext => {
  const config = {
    ...defaultContextConfig,
    ...partialConfig,
    delimiters: {
      ...defaultContextConfig.delimiters,
      ...partialConfig.delimiters,
    },
  };

  const nameCountMap = new Map<string, number>();

  // Extract path processing
  const buildBasePath = (path: BaseToken['path'], componentSetId?: string | null) => {
    const pathSegments = path
      .filter((part) => {
        // Only filter out COMPONENT nodes if they're part of a component set (have componentSetId)
        // Standalone components (no componentSetId) should be kept in the path
        if (part.type === 'COMPONENT') {
          return !componentSetId; // Keep if no componentSetId (standalone), filter if has componentSetId (variant)
        }
        return true; // Keep all non-COMPONENT nodes
      })
      .map((part) => part.name.replace(/\s+/g, '-'));

    const segmentsToUse = config.includePageInPath ? pathSegments : pathSegments.slice(1);
    return segmentsToUse.join(config.delimiters.pathSeparator) || '';
  };

  // Extract variant standardization
  // TODO: path shouldn't be involved when doing anything with variants
  const standardizeVariantCombination = (
    /**
     * @deprecated We should not use the path to determine variant properties and values.
     * We should always reference the variants object directly instead.
     */
    path: Array<{ name: string; type: string }>,
    variants: Record<string, string>,
  ) => {
    const variantsCombination = Object.entries(variants)
      .map(([prop, val]) => `${prop}=${val}`)
      .join('--');

    // Convert spaces to dashes in all variant parts
    let cleaned = variantsCombination.replace(/[\s._]/g, '-'); // Handle spaces, dots, underscores

    // Remove path components
    const pathNames = path
      .filter((part) => part.type !== 'COMPONENT')
      .map((part) => part.name.replace(/\s+/g, '-'));

    pathNames.forEach((pathName) => {
      const regex = new RegExp(`\\b${pathName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
      cleaned = cleaned
        .replace(regex, '')
        .replace(/^--+|--+$/g, '')
        .replace(/--+/g, '--');
    });

    return cleaned;
  };

  // Extract variant parsing
  /**
   * @deprecated We should not use the path to determine variant properties and values.
   * We should always reference the variants object directly instead.
   */
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
    createName(path, propertyNameConflicts = {}, variants = {}, componentSetId): string {
      const standardizedVariants = standardizeVariantCombination(path, variants);
      const basePath = buildBasePath(path, componentSetId);

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

          // Special handling for boolean-like values
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
