import { NonNullableStyleToken, StyleToken, TokenCollection } from '../types';
import { sanitizeSegment } from '../utils';
import { generateStyles } from './variants';

const USE_VARIANT_COMBINATION_PARSING = false;

export const convertVariantGroupBy = (
  tokens: TokenCollection,
  styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>,
  transform: (token: StyleToken) => Record<string, string>,
) => {
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

  if (!USE_VARIANT_COMBINATION_PARSING) {
    // No combination parsing: existing behavior
    return instanceGroupedByVariants;
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
      // && Object.keys(mixin.variants).length > 0) {
      // TODO
      instancesWithVariant.push(variantGroup as any);
      continue;
    }

    instancesWithoutVariant.push(variantGroup);
  }

  const instancesWithVariantMap = instancesWithVariant.reduce(
    (acc, variantGroup) => {
      // Strip the variant path name for grouping
      const key = variantGroup.path
        .filter((part) => part.type !== 'COMPONENT')
        .map(({ name }) => name)
        .join('__and__');

      acc[key] ??= [];
      acc[key].push(variantGroup);
      return acc;
    },
    {} as Record<string, typeof instancesWithVariant>,
  );

  const parsedVariantInstances = Object.entries(instancesWithVariantMap).flatMap(
    ([key, mixins]) => {
      const cssByVariantCombinations = generateStyles(mixins);

      return Object.entries(cssByVariantCombinations).map(([variantsCombination, css]) => {
        const variantCombinationName = sanitizeSegment(mixins[0].path
          .map((part) => {
            // This path part lists the variant properties, override with the
            // subset needed for the variant combination
            if (part.type === 'COMPONENT') {
              return variantsCombination;
            }

            return part.name;
          })
          .join('__'));

        return { variantCombinationName, css };
      });
    },
  );
  
  // With combination parsing: new behavior
  return [...instancesWithoutVariant, ...parsedVariantInstances];
};

/**
 * Used specifically for tailwind styles
 */
export const backToStyleTokens = (parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>) => {
  return parsedStyleTokens.map((__) => {
    const tokens = Object.entries(__.css).map(
      ([property, rawValue]) =>
        // Casting here since tailwind only needs these 2 properties
        ({
          property,
          rawValue,
        }) as NonNullableStyleToken,
    );

    return {
      variantPath: __.variantCombinationName,
      tokens,
    };
  });
};
