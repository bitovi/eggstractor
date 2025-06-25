import { NonNullableStyleToken, StyleToken, TokenCollection } from '../types';
import { generateStyles } from './variants';

export const convertVariantGroupBy = (
  tokens: TokenCollection,
  styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>,
  transform: (token: StyleToken) => Record<string, string>,
) => {
  const instanceGroupedByVariants = Object.entries(styleTokensGroupedByVariantCombination)
    .map(([variantCombinationName, groupTokens]) => {
      // TODO: rename back to component set id
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
        variantCombinationName,
        path: groupTokens[0].path,
        componentId,
        componentSetId,
        variants: componentId ? tokens.components[componentId].variantProperties : {},
        css,
        // groupTokens,// Just for debugging
      };

      return _;
    })
    .filter((variantGroup) => Object.keys(variantGroup.css).length > 0);

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
      console.log('generateStyles', key);
      const cssByVariantCombinations = generateStyles(mixins);

      return Object.entries(cssByVariantCombinations).map(([variantsCombination, css]) => {
        const variantCombinationName = mixins[0].path
          .map((part) => {
            // This path part lists the variant properties, override with the
            // subset needed for the variant combination
            if (part.type === 'COMPONENT') {
              return variantsCombination;
            }

            return part.name;
          })
          .join('__');

        return { variantCombinationName, css };
      });
    },
  );
  console.log('parsedVariantInstances', parsedVariantInstances);

  // No combination parsing
  //   return [...mixins];
  // With combination parsing
  return [...instancesWithoutVariant, ...parsedVariantInstances];
};

export const backToStyleTokens = (parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>) => {
  return parsedStyleTokens.map((__) => {
    const tokens = Object.entries(__.css).map(
      ([property, rawValue]) =>
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
