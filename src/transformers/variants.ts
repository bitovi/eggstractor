export type Input = {
  variants: Record<string, string>;
  css: Record<string, string>;
}[];

let i = 0;
/**
 * Unique numeric id's starting from 0
 */
const getId = () => {
  return ++i;
};

/**
 * Check if objects match all property and value pairs
 */
function shallowEqual<T extends Record<string, any>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

type StyleNode = {
  cssProperty: string;
  cssValue: string;
  variants: Record<string, string>;
  possibleVariants: Record<string, string>;
  id: number;
};

/**
 * Filter any styles with unique variant combinations.
 * There is an exception, if a variant combinations is more common than all others, it will be considered "unique"
 */
const splitByMatch = (items: StyleNode[]): [StyleNode[], StyleNode[]] => {
  const matchingCounts = new Array<number>(items.length).fill(0);
  const exceptionCounts = new Array<number>(items.length).fill(0);

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (
        a.cssProperty === b.cssProperty &&
        shallowEqual(a.variants, b.variants)
      ) {
        if (a.cssValue === b.cssValue) {
          exceptionCounts[i] += 1;
          exceptionCounts[j] += 1;
        } else {
          matchingCounts[i] += 1;
          matchingCounts[j] += 1;
        }
      }
    }
  }

  const matching: StyleNode[] = [];
  const nonMatching: StyleNode[] = [];

  for (let i = 0; i < items.length; i++) {
    // TODO: Allows for "shorter" classNames, but leads to "random" classNames
    // that are short but should be included in another className
    // Alternative is commented out below
    if (matchingCounts[i] && matchingCounts[i] > exceptionCounts[i]) {
      // TODO: Avoids "random" classNames that are short that should be included in existing classNames
      // but creates "longer" classNames
    // if (matchingCounts[i]) {// && matchingCounts[i] > exceptionCounts[i]) {
      matching.push(items[i]);
    } else {
      nonMatching.push(items[i]);
    }
  }

  return [nonMatching, matching];
};
/**
 * Compare element with every other element in array. If comparison is true, exclude from array
 */
// TODO: is this just Array.filter()
function removeByComparison<T>(
  items: T[],
  comparison: (a: T, b: T) => boolean,
): T[] {
  const result: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    const isAlreadyIncluded = result.some((existing) =>
      comparison(existing, current),
    );

    if (!isAlreadyIncluded) {
      result.push(current);
    }
  }

  return result;
}

// TODO: consideration, we already have "Style" token, so maybe the shape of the input should match the existing style tokens
export const getInitialStyleNodes = (source: Input): StyleNode[] => {
  const styleNodes: StyleNode[] = [];

  for (const instance of source) {
    Object.entries(instance.css).map(([cssProperty, cssValue]) => {
      // Each node requires referring its "origin" node
      // The "origin" nodes are created in this loop for a single style's variants
      const id = getId();

      for (let i = 0; i < Object.keys(instance.variants).length; i++) {
        styleNodes.push({
          cssProperty,
          cssValue,
          variants: {},
          possibleVariants: { ...instance.variants },
          id,
        });
      }
    });
  }

  return styleNodes;
};

const getFinalizedStyleNodes = (
  styles: StyleNode[],
): [StyleNode[], StyleNode[]] => {
  // "uniques" are finalized, duplicates need to be processed further
  const [uniques, duplicates] = splitByMatch(styles);

  // Remove any variants trying to apply a style that has already been covered
  const cleanedDuplicates: StyleNode[] = duplicates.filter(
    (duplicate) => !uniques.some((unique) => unique.id === duplicate.id),
  );

  return [uniques, cleanedDuplicates];
};

export const createChildStyleNodes = (styles: StyleNode[]): StyleNode[] => {
  if (!styles.length) {
    return [];
  }

  const [uniques, duplicates] = getFinalizedStyleNodes(styles);

  const nestedChildStyleNodes = duplicates
    .flatMap((instance) => {
      return Object.entries(instance.possibleVariants).map(
        ([variantProperty, variantValue]) => {
          const possibleVariants = { ...instance.possibleVariants };
          delete possibleVariants[variantProperty];

          const styleNode: StyleNode = {
            cssProperty: instance.cssProperty,
            cssValue: instance.cssValue,
            variants: {
              ...instance.variants,
              [variantProperty]: variantValue,
            },
            possibleVariants,
            id: instance.id,
          };

          return styleNode;
        },
      );
    });

  const cleanedNestedChildStyleNodes: StyleNode[] = removeByComparison(
    nestedChildStyleNodes,
    (a, b) => {
      return (
        // Has to also match css style
        a.cssProperty === b.cssProperty &&
        a.cssValue === b.cssValue &&
        // Check if combination of variants match
        // areVariantsEqual(a, b) &&
        shallowEqual(a.variants, b.variants) &&
        // Check if style belongs to the same "instance"
        // TODO: we could do this by adding an id to instances instead
        shallowEqual(a.possibleVariants, b.possibleVariants)
      );
    },
  );

  return [...uniques, ...createChildStyleNodes(cleanedNestedChildStyleNodes)];
};

export const convertStyleNodesToCssStylesheet = (
  styleNodes: StyleNode[],
): Record<string, Record<string, string>> => {
  const styleTags: Record<string, Record<string, string>> = {};

  // Group all styles by "className/mixin/utility"
  for (const style of styleNodes) {
    const key = Object.entries(style.variants)
      .map(
        ([variantProperty, variantValue]) =>
          `${variantProperty}-${variantValue}`,
      )
      .join("--") || 'ROOT';

    styleTags[key] ??= {};
    if (
      styleTags[key][style.cssProperty] &&
      styleTags[key][style.cssProperty] !== style.cssValue
    ) {
      console.error(
        styleTags,
        key,
        styleTags[key],
        styleTags[key][style.cssProperty],
        style.cssValue,
      );
      throw new Error("Unexpected style exists for combination of variant");
    }
    styleTags[key][style.cssProperty] = style.cssValue;
  }

  return styleTags;
};

export const generateStyles = (source: Input) => {
  const initialStyleNodes = getInitialStyleNodes(source);
  const styleNodes = createChildStyleNodes(initialStyleNodes);
  const stylesheet = convertStyleNodesToCssStylesheet(styleNodes);
  return stylesheet;
};
