import { NonNullableStyleToken, StyleToken, TokenCollection } from '../types';
import { sanitizeSegment } from '../utils';
import { generateStyles, USE_VARIANT_COMBINATION_PARSING } from './variants';

export const convertVariantGroupBy = (
  tokens: TokenCollection,
  styleTokensGroupedByVariantCombination: Record<string, StyleToken[]>,
  transform: (token: StyleToken) => Record<string, string>,
) => {
  // Pre-compute transforms to avoid duplicate work
  const transformCache = new Map<StyleToken, Record<string, string>>();

  const instanceGroupedByVariants = Object.entries(styleTokensGroupedByVariantCombination)
    .map(([variantCombinationName, groupTokens]) => {
      try {
        if (groupTokens.length === 0) return null;

        const firstToken = groupTokens[0];

        // Fast validation using early exit instead of .every()
        let componentId = firstToken.componentId;
        let componentSetId = firstToken.componentSetId;

        if (componentId || componentSetId) {
          for (let i = 1; i < groupTokens.length; i++) {
            if (componentId && groupTokens[i].componentId !== componentId) {
              throw new Error('Unexpected component id mismatch');
            }
            if (componentSetId && groupTokens[i].componentSetId !== componentSetId) {
              throw new Error('Unexpected component set id mismatch');
            }
          }
        }

        // Optimized CSS building - avoid object spreading
        const css: Record<string, string> = {};
        for (const token of groupTokens) {
          let singleStyle = transformCache.get(token);
          if (!singleStyle) {
            singleStyle = transform(token);
            transformCache.set(token, singleStyle);
          }

          // Direct assignment instead of spreading
          Object.assign(css, singleStyle);
        }

        // Early exit if no styles
        if (Object.keys(css).length === 0) return null;

        return {
          variantCombinationName,
          path: firstToken.path,
          componentId,
          componentSetId,
          variants: componentId ? tokens.components[componentId].variantProperties : {},
          css,
        };
      } catch (error: any) {
        console.error(
          `❌ Skipping token group "${variantCombinationName}" due to error:`,
          error.message,
        );
        return null;
      }
    })
    .filter(
      (variantGroup): variantGroup is NonNullable<typeof variantGroup> => variantGroup !== null,
    );

  if (!USE_VARIANT_COMBINATION_PARSING()) {
    // No combination parsing: existing behavior
    return instanceGroupedByVariants;
  }

  // Pre-filter with Set for O(1) lookups
  const instancesWithVariant: Array<{
    variantCombinationName: string;
    path: any[];
    componentId: string;
    componentSetId: string;
    variants: any;
    css: Record<string, string>;
  }> = [];

  const instancesWithoutVariant = [];

  for (const variantGroup of instanceGroupedByVariants) {
    if (variantGroup.componentSetId && variantGroup.componentId) {
      instancesWithVariant.push(variantGroup as any);
    } else {
      instancesWithoutVariant.push(variantGroup);
    }
  }

  // Cache path key generation
  const pathKeyCache = new Map<any[], string>();

  const instancesWithVariantMap = instancesWithVariant.reduce(
    (acc, variantGroup) => {
      let key = pathKeyCache.get(variantGroup.path);
      if (!key) {
        key = variantGroup.path
          .filter((part) => part.type !== 'COMPONENT')
          .map(({ name }) => name)
          .join('__and__');
        pathKeyCache.set(variantGroup.path, key);
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(variantGroup);
      return acc;
    },
    {} as Record<string, typeof instancesWithVariant>,
  );

  // Cache sanitized variant names
  const variantNameCache = new Map<string, string>();

  const parsedVariantInstances = Object.entries(instancesWithVariantMap).flatMap(([_, mixins]) => {
    const cssByVariantCombinations = generateStyles(mixins);

    return Object.entries(cssByVariantCombinations).map(([variantsCombination, css]) => {
      const pathKey = mixins[0].path
        .map((part) => (part.type === 'COMPONENT' ? variantsCombination : part.name))
        .join('__');

      let variantCombinationName = variantNameCache.get(pathKey);
      if (!variantCombinationName) {
        variantCombinationName = sanitizeSegment(pathKey);
        variantNameCache.set(pathKey, variantCombinationName);
      }

      return { variantCombinationName, css };
    });
  });

  // With combination parsing: new behavior
  return [...instancesWithoutVariant, ...parsedVariantInstances];
};

/**
 * Optimized version for tailwind styles
 */
export const backToStyleTokens = (parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>) => {
  // Pre-allocate array if possible
  const result = new Array(parsedStyleTokens.length);

  for (let i = 0; i < parsedStyleTokens.length; i++) {
    const parsedStyleToken = parsedStyleTokens[i];
    const cssEntries = Object.entries(parsedStyleToken.css);

    // Pre-allocate tokens array
    const tokens = new Array(cssEntries.length);

    for (let j = 0; j < cssEntries.length; j++) {
      const [property, rawValue] = cssEntries[j];
      tokens[j] = { property, rawValue } as NonNullableStyleToken;
    }

    result[i] = {
      variantPath: parsedStyleToken.variantCombinationName,
      tokens,
    };
  }

  return result;
};
