import { NonNullableStyleToken, StyleToken, TokenCollection } from '../types';
import { generateStyles, USE_VARIANT_COMBINATION_PARSING } from './variants';

export const convertVariantGroupBy = (
  tokens: TokenCollection,
  styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>,
  transform: (token: StyleToken) => Record<string, string>,
  nameTransform: {
    createName: (
      path: Array<{ name: string; type: string }>,
      variantsCombination: string,
      propertyNameConflicts?: Record<string, string[]>,
      variants?: Record<string, string>,
    ) => string;
  },
) => {
  const globalValueConflicts = new Map<string, Set<string>>();

  Object.values(styleTokensGroupedByVariantCombination).forEach((groupTokens) => {
    const componentId = groupTokens[0].componentId;
    if (!componentId) return;

    const variants = tokens.components[componentId]?.variantProperties || {};

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
    .map(([variantCombinationName, groupTokens]) => {
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

      const css = groupTokens.reduce(
        (styles, token) => {
          const singleStyle = transform(token);
          return { ...styles, ...singleStyle };
        },
        {} as Record<string, string>,
      );

      const _ = {
        // Used for grouping
        variantCombinationName,
        // Used for naming
        path: groupTokens[0].path,
        // Used for finding variants
        componentId,
        // Used for finding all possible variants
        componentSetId,
        // Variants
        variants: componentId ? tokens.components[componentId].variantProperties : {},
        css,
      };

      return _;
    })
    .filter((variantGroup) => Object.keys(variantGroup.css).length > 0);

  if (!USE_VARIANT_COMBINATION_PARSING()) {
    return instanceGroupedByVariants.map((variantGroup) => {
      // FIX: Reconstruct property=value format for templated
      const propertyValueFormat =
        Object.entries(variantGroup.variants || {})
          .map(([prop, val]) => `${prop}=${val}`)
          .join('--') || variantGroup.variantCombinationName;

      const finalName = nameTransform.createName(
        variantGroup.path,
        propertyValueFormat,
        conflictMap,
        variantGroup.variants,
      );

      return {
        ...variantGroup,
        variantCombinationName: finalName,
      };
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
    if (variantGroup.componentSetId && variantGroup.componentSetId) {
      instancesWithVariant.push(variantGroup as any);
      continue;
    }

    instancesWithoutVariant.push(variantGroup);
  }

  const instancesWithVariantMap = instancesWithVariant.reduce(
    (acc, variantGroup) => {
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

  const parsedVariantInstances = Object.entries(instancesWithVariantMap).flatMap(([_, mixins]) => {
    const cssByVariantCombinations = generateStyles(mixins);

    return Object.entries(cssByVariantCombinations).map(([variantsCombination, css]) => {
      const variantCombinationName = nameTransform.createName(
        mixins[0].path,
        variantsCombination,
        conflictMap,
      );

      return {
        variantCombinationName,
        css,
        // Preserve the path for context-aware generators
        path: mixins[0].path,
      };
    });
  });

  // With combination parsing: new behavior
  return [...instancesWithoutVariant, ...parsedVariantInstances];
};

/**
 * Used specifically for tailwind styles
 */
export const backToStyleTokens = (parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>) => {
  return parsedStyleTokens.map((parsedStyleToken) => {
    const tokens = Object.entries(parsedStyleToken.css).map(
      ([property, rawValue]) =>
        // Casting here since tailwind only needs these 2 properties
        ({
          property,
          rawValue,
          // Preserve the path for context-aware generators
          path: parsedStyleToken.path,
        }) as NonNullableStyleToken,
    );

    return {
      variantPath: parsedStyleToken.variantCombinationName,
      tokens,
    };
  });
};
