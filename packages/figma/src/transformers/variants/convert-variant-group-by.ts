import { StyleToken, TokenCollection } from '../../types';
import { NamingContext } from '../../utils';
import { updatePaddingStylesBasedOnBorder } from '../utils';
import {
  generateCombinatorialStyles,
  StylesForVariantsCombination,
} from './generate-combinatorial-styles';

export const convertVariantGroupBy = (
  tokenCollection: TokenCollection,
  styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>,
  /**
   * @deprecated The input for this function should already be formatted
   * correctly. This is basically only different for scss support.
   */
  transform: (token: StyleToken) => Record<string, string>,
  namingContext: NamingContext,
  useCombinatorialParsing: boolean,
): ({ key: string } & StylesForVariantsCombination)[] => {
  const globalValueConflicts = new Map<string, Set<string>>();

  Object.values(styleTokensGroupedByVariantCombination).forEach((groupTokens) => {
    const componentId = groupTokens[0].componentId;
    if (!componentId) return;

    const variants = tokenCollection.components[componentId]?.variantProperties || {};

    Object.entries(variants).forEach(([property, value]) => {
      if (!globalValueConflicts.has(value)) {
        globalValueConflicts.set(value, new Set());
      }
      globalValueConflicts.get(value)!.add(property.toLowerCase());
    });
  });

  const conflictMap: Record<string, string[]> = {};
  globalValueConflicts.forEach((properties, value) => {
    if (properties.size > 1) {
      conflictMap[value.toLowerCase()] = Array.from(properties);
    }
  });

  const instanceGroupedByVariants = Object.entries(styleTokensGroupedByVariantCombination)
    .map(([key, groupTokens]) => {
      const componentId = groupTokens[0].componentId
        ? groupTokens.every((token) => token.componentId === groupTokens[0].componentId)
          ? groupTokens[0].componentId
          : (() => {
              throw new Error('Unexpected component id mismatch');
            })()
        : undefined;

      const componentSetId = groupTokens[0].componentSetId
        ? groupTokens.every((token) => token.componentSetId === groupTokens[0].componentSetId)
          ? groupTokens[0].componentSetId
          : (() => {
              throw new Error('Unexpected component id mismatch');
            })()
        : undefined;

      const styles = groupTokens.reduce(
        (styles, token) => {
          const singleStyle = transform(token);
          return { ...styles, ...singleStyle };
        },
        {} as Record<string, string>,
      );

      return {
        // Used temporarily for grouping and should not be used outside of this
        // function
        key,
        // Used for naming
        path: groupTokens[0].path,
        // Used for finding variants
        componentId,
        // Used for finding all possible variants
        componentSetId,
        // Variants
        variants: componentId ? tokenCollection.components[componentId].variantProperties : {},
        styles,
      };
    })
    .filter((variantGroup) => Object.keys(variantGroup.styles).length > 0);

  if (!useCombinatorialParsing) {
    return instanceGroupedByVariants.map((variantGroup) => {
      const key = namingContext.createName(variantGroup.path, conflictMap, variantGroup.variants);
      return updatePaddingStylesBasedOnBorder({
        ...variantGroup,
        key,
      });
    });
  }

  const instancesWithVariant: (Omit<
    (typeof instanceGroupedByVariants)[number],
    'componentId' | 'componentSetId'
  > & {
    componentId: string;
    componentSetId: string;
  })[] = [];

  const instancesWithoutVariant: typeof instanceGroupedByVariants = [];

  for (const variantGroup of instanceGroupedByVariants) {
    if (variantGroup.componentId && variantGroup.componentSetId) {
      // Do not generate key yet for instances with variants since we need to
      // calculate combinatorial styles first
      instancesWithVariant.push(
        variantGroup as typeof variantGroup & {
          componentId: string;
          componentSetId: string;
        },
      );
      continue;
    }

    // No variants so we can generate the key now
    const key = namingContext.createName(variantGroup.path, conflictMap, variantGroup.variants);
    instancesWithoutVariant.push({ ...variantGroup, key });
  }

  const instancesWithVariantMap = instancesWithVariant.reduce(
    (acc, variantGroup) => {
      // This key isn't used outside of organizing components within a component
      // set. It should not be used outside of this temporary grouping.
      const key = variantGroup.path
        .filter((part) => part.type !== 'COMPONENT')
        .map(({ name }) => name.replace(/\s+/g, '-'))
        .join('.');

      acc[key] ??= [];
      acc[key].push(variantGroup);
      return acc;
    },
    {} as Record<string, typeof instancesWithVariant>,
  );

  const parsedVariantInstances = Object.entries(instancesWithVariantMap).flatMap(
    // We should not use the key from Object.entries since it's for temporary
    // grouping only. Instead, use namingContext to generate the final key.
    ([, instances]) => {
      const cssByVariantCombinations = generateCombinatorialStyles(instances);

      return Object.entries(cssByVariantCombinations).map(([, cssByVariantCombination]) => {
        const path = cssByVariantCombination.path;
        const key = namingContext.createName(path, conflictMap, cssByVariantCombination.variants);
        return {
          key,
          styles: cssByVariantCombination.styles,
          variants: cssByVariantCombination.variants,
          // Preserve the path for context-aware generators
          path,
        };
      });
    },
  );

  // With combination parsing: new behavior
  return [...instancesWithoutVariant, ...parsedVariantInstances].map((instance) =>
    updatePaddingStylesBasedOnBorder(instance),
  );
};
