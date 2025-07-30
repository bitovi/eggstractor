export type Input = {
  variants: Record<string, string>;
  css: Record<string, string>;
}[];

type StyleNode = {
  cssProperty: string;
  cssValue: string;
  variants: Record<string, string>;
  possibleVariants: Record<string, string>;
  id: number;
};

/**
 * When true, will parse variant combinations and create unique styles for each
 * combination.
 */
export const USE_VARIANT_COMBINATION_PARSING = (): boolean => {
  return true;
};

let i = 0;
/**
 * @deprecated - not needed once we start using componentId from StyleToken
 * Unique numeric id's starting from 0
 */
const getId = () => {
  return ++i;
};

/**
 * Optimized shallow equality check with early exit
 */
function shallowEqual<T extends Record<string, any>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Early exit on first mismatch
  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Optimized version using Maps for O(1) lookups instead of nested loops
 */
const splitByMatch = (items: StyleNode[]): [StyleNode[], StyleNode[]] => {
  // Create lookup maps for faster comparison
  const propertyVariantMap = new Map<string, StyleNode[]>();

  // Group by cssProperty + variant combination for O(1) lookups
  for (const item of items) {
    const variantKey = Object.entries(item.variants)
      .sort(([a], [b]) => a.localeCompare(b)) // Consistent ordering
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    const key = `${item.cssProperty}#${variantKey}`;

    if (!propertyVariantMap.has(key)) {
      propertyVariantMap.set(key, []);
    }
    propertyVariantMap.get(key)!.push(item);
  }

  const matchingCounts = new Map<number, number>();
  const exceptionCounts = new Map<number, number>();

  // Count matches using grouped data
  for (const group of propertyVariantMap.values()) {
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        if (a.cssValue === b.cssValue) {
          exceptionCounts.set(a.id, (exceptionCounts.get(a.id) || 0) + 1);
          exceptionCounts.set(b.id, (exceptionCounts.get(b.id) || 0) + 1);
        } else {
          matchingCounts.set(a.id, (matchingCounts.get(a.id) || 0) + 1);
          matchingCounts.set(b.id, (matchingCounts.get(b.id) || 0) + 1);
        }
      }
    }
  }

  const matching: StyleNode[] = [];
  const nonMatching: StyleNode[] = [];

  for (const item of items) {
    const matchCount = matchingCounts.get(item.id) || 0;
    const exceptionCount = exceptionCounts.get(item.id) || 0;

    if (matchCount && matchCount > exceptionCount) {
      matching.push(item);
    } else {
      nonMatching.push(item);
    }
  }

  return [nonMatching, matching];
};

/**
 * Optimized deduplication using Set for O(1) lookups
 */
function removeByComparison<T>(items: T[], comparison: (a: T, b: T) => boolean): T[] {
  const result: T[] = [];
  const seen = new Set<string>();

  for (const current of items) {
    // Create a hash key for faster comparison
    const key = JSON.stringify(current); // Simple but effective for most cases

    if (!seen.has(key)) {
      // Still need detailed comparison for edge cases
      const isAlreadyIncluded = result.some((existing) => comparison(existing, current));

      if (!isAlreadyIncluded) {
        result.push(current);
        seen.add(key);
      }
    }
  }

  return result;
}

/**
 * Optimized to reduce object creation and iterations
 */
export const getInitialStyleNodes = (source: Input): StyleNode[] => {
  const styleNodes: StyleNode[] = [];

  for (const instance of source) {
    const cssEntries = Object.entries(instance.css);
    const variantKeys = Object.keys(instance.variants);
    const variantCount = variantKeys.length;

    for (const [cssProperty, cssValue] of cssEntries) {
      const id = getId();

      // Pre-allocate nodes for this CSS property
      for (let i = 0; i < variantCount; i++) {
        styleNodes.push({
          cssProperty,
          cssValue,
          variants: {},
          possibleVariants: { ...instance.variants }, // Only clone once per loop
          id,
        });
      }
    }
  }

  return styleNodes;
};

/**
 * Optimized with early exit and reduced iterations
 */
const getFinalizedStyleNodes = (styles: StyleNode[]): [StyleNode[], StyleNode[]] => {
  const [uniques, duplicates] = splitByMatch(styles);

  // Use Set for O(1) lookup instead of array.some()
  const uniqueIds = new Set(uniques.map((u) => u.id));

  const cleanedDuplicates = duplicates.filter((duplicate) => !uniqueIds.has(duplicate.id));

  return [uniques, cleanedDuplicates];
};

/**
 * Optimized recursive function with memoization
 */
const memoizedResults = new Map<string, StyleNode[]>();

export const createChildStyleNodes = (styles: StyleNode[]): StyleNode[] => {
  if (!styles.length) {
    return [];
  }

  // Create cache key for memoization
  const cacheKey = JSON.stringify(
    styles.map((s) => ({
      id: s.id,
      variants: s.variants,
      possibleVariants: s.possibleVariants,
    })),
  );

  if (memoizedResults.has(cacheKey)) {
    return memoizedResults.get(cacheKey)!;
  }

  const [uniques, duplicates] = getFinalizedStyleNodes(styles);

  // Pre-allocate array with estimated size
  const nestedChildStyleNodes: StyleNode[] = [];

  for (const instance of duplicates) {
    const possibleVariantEntries = Object.entries(instance.possibleVariants);

    for (const [variantProperty, variantValue] of possibleVariantEntries) {
      const possibleVariants = { ...instance.possibleVariants };
      delete possibleVariants[variantProperty];

      nestedChildStyleNodes.push({
        cssProperty: instance.cssProperty,
        cssValue: instance.cssValue,
        variants: {
          ...instance.variants,
          [variantProperty]: variantValue,
        },
        possibleVariants,
        id: instance.id,
      });
    }
  }

  const cleanedNestedChildStyleNodes: StyleNode[] = removeByComparison(
    nestedChildStyleNodes,
    (a, b) => {
      return (
        a.cssProperty === b.cssProperty &&
        a.cssValue === b.cssValue &&
        shallowEqual(a.variants, b.variants) &&
        shallowEqual(a.possibleVariants, b.possibleVariants)
      );
    },
  );

  const result = [...uniques, ...createChildStyleNodes(cleanedNestedChildStyleNodes)];

  // Cache result for future use
  memoizedResults.set(cacheKey, result);

  return result;
};

/**
 * Optimized with pre-allocated objects and reduced string operations
 */
export const convertStyleNodesToCssStylesheet = (
  styleNodes: StyleNode[],
): Record<string, Record<string, string>> => {
  const styleTags: Record<string, Record<string, string>> = {};
  const keyCache = new Map<StyleNode, string>();

  for (const style of styleNodes) {
    let key = keyCache.get(style);

    if (!key) {
      const variantEntries = Object.entries(style.variants);

      if (variantEntries.length === 0) {
        key = 'ROOT';
      } else {
        // Sort for consistent key generation
        variantEntries.sort(([a], [b]) => a.localeCompare(b));
        key = variantEntries
          .map(([variantProperty, variantValue]) => `${variantProperty}-${variantValue}`)
          .join('--');
      }

      keyCache.set(style, key);
    }

    if (!styleTags[key]) {
      styleTags[key] = {};
    }

    const existingValue = styleTags[key][style.cssProperty];
    if (existingValue && existingValue !== style.cssValue) {
      console.error('Style conflict:', {
        key,
        property: style.cssProperty,
        existing: existingValue,
        new: style.cssValue,
      });
      throw new Error('Unexpected style exists for combination of variant');
    }

    styleTags[key][style.cssProperty] = style.cssValue;
  }

  return styleTags;
};

/**
 * Main export function - now optimized
 */
export const generateStyles = (source: Input) => {
  const initialStyleNodes = getInitialStyleNodes(source);
  const styleNodes = createChildStyleNodes(initialStyleNodes);
  const stylesheet = convertStyleNodesToCssStylesheet(styleNodes);
  return stylesheet;
};
