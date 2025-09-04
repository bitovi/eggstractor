import { NonNullableStyleToken, StyleToken, TokenCollection } from '../types';
import { NamingContext } from '../utils';
import { generateCombinatorialStyles, StylesForVariantsCombination } from './variants';

type PartialStyleToken = Omit<
  StyleToken,
  'name' | 'property' | 'type' | 'value' | 'rawValue' | 'variableTokenMapByProperty'
>;

export const convertVariantGroupBy = (
  tokens: TokenCollection,
  styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>,
  transform: (token: StyleToken) => Record<string, string>,
  namingContext: NamingContext,
  useCombinatorialParsing: boolean = true,
): (PartialStyleToken & { key: string } & StylesForVariantsCombination)[] => {
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
        // Used for grouping
        key,
        // Used for naming
        path: groupTokens[0].path,
        // Used for finding variants
        componentId,
        // Used for finding all possible variants
        componentSetId,
        // Variants
        variants: componentId ? tokens.components[componentId].variantProperties : {},
        styles,
      };
    })
    .filter((variantGroup) => Object.keys(variantGroup.styles).length > 0);

  if (!useCombinatorialParsing) {
    return instanceGroupedByVariants.map((variantGroup) => {
      return {
        ...variantGroup,
        key: namingContext.createName(
          variantGroup.path,
          conflictMap,
          variantGroup.variants,
        ),
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
    if (variantGroup.componentId && variantGroup.componentSetId) {
      instancesWithVariant.push(
        variantGroup as typeof variantGroup & {
          componentId: string;
          componentSetId: string;
        },
      );
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

  const parsedVariantInstances = Object.entries(instancesWithVariantMap).flatMap(([, mixins]) => {
    const cssByVariantCombinations = generateCombinatorialStyles(mixins);

    return Object.entries(cssByVariantCombinations).map(([, cssByVariantCombination]) => {
      const key = namingContext.createName(
        mixins[0].path,
        conflictMap,
        cssByVariantCombination.variants,
      );

      return {
        key,
        styles: cssByVariantCombination.styles,
        variants: cssByVariantCombination.variants,
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
    const tokens = Object.entries(parsedStyleToken.styles).map(
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
      variantPath: parsedStyleToken.key,
      tokens,
    };
  });
};
