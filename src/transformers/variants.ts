// import { log } from "../utilities/log";

const log = (...args: any) => {
    // console.log(...args);
}

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

// type Variant = {
//   variantProperty: string;
//   variantValue: string | number | boolean;
// }

type StyleNode = {
  cssProperty: string;
  cssValue: string;
  // variants: Variant[];
  variants: Record<string, string>;
  possibleVariants: Record<string, string>;
  id: number;
};

/**
 * Assumes that both variants are pre-sorted.
 *
 * Compares arrays if their values are equal.
 */
// function areVariantsEqual(styleA: Style, styleB: Style): boolean {
//   const variantsA = styleA.variants;
//   const variantsB = styleB.variants;

//   if (variantsA.length !== variantsB.length) {
//     return false;
//   }

//   for (let i = 0; i < variantsA.length; i++) {
//     const a = variantsA[i];
//     const b = variantsB[i];

//     if (a.variantProperty !== b.variantProperty || a.variantValue !== b.variantValue) {
//       return false;
//     }
//   }

//   return true;
// }

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

      // if (shallowEqual(a.variants, {})) {
      //   log(a, a.variants);
      //   throw new Error("Unexpected variants is empty");
      // }

      // if (areVariantsEqual(a, b) && a.cssProperty === b.cssProperty) {
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
    // if (matchingCounts[i] && matchingCounts[i] > exceptionCounts[i]) {
      // TODO: Avoids "random" classNames that are short that should be included in existing classNames
      // but creates "longer" classNames
      if (matchingCounts[i]) {// && matchingCounts[i] > exceptionCounts[i]) {
      matching.push(items[i]);
    } else {
      if (matchingCounts[i] && exceptionCounts[i]) {
        log("splitByMatch", matchingCounts[i], exceptionCounts[i], items[i]);
      }
      nonMatching.push(items[i]);
    }
  }

  return [nonMatching, matching];
};

// function splitByMatch<T>(
//   items: T[],
//   isMatch: (a: T, b: T) => boolean
// ): [nonMatching: T[], matching: T[]] {
//   const matchingFlags = new Array<boolean>(items.length).fill(false);

//   for (let i = 0; i < items.length; i++) {
//     for (let j = i + 1; j < items.length; j++) {
//       if (isMatch(items[i], items[j])) {
//         matchingFlags[i] = true;
//         matchingFlags[j] = true;
//       }
//     }
//   }

//   const matching: T[] = [];
//   const nonMatching: T[] = [];

//   for (let i = 0; i < items.length; i++) {
//     if (matchingFlags[i]) {
//       matching.push(items[i]);
//     } else {
//       nonMatching.push(items[i]);
//     }
//   }

//   return [nonMatching, matching];
// }

// function separateDuplicates<T>(
//   items: T[],
//   isDuplicate: (a: T, b: T) => boolean
// ): { uniques: T[]; duplicates: T[] } {
//   const duplicates: T[] = [];
//   const uniques: T[] = [];
//   const used = new Set<number>();

//   for (let i = 0; i < items.length; i++) {
//     if (used.has(i)) continue;

//     const group: T[] = [items[i]];
//     used.add(i);

//     for (let j = i + 1; j < items.length; j++) {
//       if (!used.has(j) && isDuplicate(items[i], items[j])) {
//         group.push(items[j]);
//         used.add(j);
//       }
//     }

//     if (group.length > 1) {
//       duplicates.push(...group);
//     } else {
//       uniques.push(...group);
//     }
//   }

//   return { uniques, duplicates };
// }

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

      // styleNodes.push(
      //   ...new Array<StyleNode>(Object.keys(instance.variants).length).fill({
      //     cssProperty,
      //     cssValue,
      //     variants: {},
      //     possibleVariants: { ...instance.variants },
      //     id,
      //   }),
      // );

      // Object.entries(instance.variants).map(
      //   ([variantProperty, variantValue]) => {
      //     const possibleVariants: Record<string, string> =
      //       /* adding type here to avoid having to type assert for delete keyword below */ {
      //         ...instance.variants,
      //       };

      //     // TODO: there should be a warning or something when possibleVariants is empty object
      //     delete possibleVariants[variantProperty];

      //     styleNodes.push({
      //       cssProperty,
      //       cssValue,
      //       // Start off an array of one cause this array will grow to all possible combinations over time
      //       // variants: [{
      //       //   variantProperty,
      //       //   variantValue,
      //       // }],
      //       variants: {
      //         // [variantProperty]: variantValue,
      //       },
      //       // TODO: This would be the only information that's missing from style tokens
      //       possibleVariants,
      //       id,
      //     });
      //   },
      // );

      // TODO: consider applying this step naturally in the other step where "leaf" nodes are created based on possibleVariants
      // Object.entries(instance.variants).map(
      //   ([variantProperty, variantValue]) => {
      //     const possibleVariants: Record<string, string> =
      //       /* adding type here to avoid having to type assert for delete keyword below */ {
      //         ...instance.variants,
      //       };

      //     // TODO: there should be a warning or something when possibleVariants is empty object
      //     delete possibleVariants[variantProperty];

      //     styleNodes.push({
      //       cssProperty,
      //       cssValue,
      //       // Start off an array of one cause this array will grow to all possible combinations over time
      //       // variants: [{
      //       //   variantProperty,
      //       //   variantValue,
      //       // }],
      //       variants: {
      //         // [variantProperty]: variantValue,
      //       },
      //       // TODO: This would be the only information that's missing from style tokens
      //       possibleVariants,
      //       id,
      //     });
      //   },
      // );
    });
  }

  return styleNodes;
};

const getFinalizedStyleNodes = (
  styles: StyleNode[],
): [StyleNode[], StyleNode[]] => {
  // Assumes that if any style nodes have an empty variants, all other style nodes would also have empty variants
  // if (shallowEqual(styles[0].variants, {})) {
  //   return [[], styles];
  // }

  // "uniques" are finalized, duplicates need to be processed further
  const [uniques, duplicates] = splitByMatch(styles);

  // Remove any variants trying to apply a style that has already been covered
  const cleanedDuplicates: StyleNode[] = duplicates.filter(
    (duplicate) => !uniques.some((unique) => unique.id === duplicate.id),
  );

  return [uniques, cleanedDuplicates];
};

export const createChildStyleNodes = (styles: StyleNode[]): StyleNode[] => {
  log("createChildStyleNodes -> ", "styles", styles);

  if (!styles.length) {
    return [];
  }

  const [uniques, duplicates] = getFinalizedStyleNodes(styles);

  const nestedChildStyleNodes = duplicates
    .flatMap((instance) => {
      return Object.entries(instance.possibleVariants).map(
        ([variantProperty, variantValue]) => {
          // TODO: is there a way to do this so we don't have to use "delete" key word?
          // const { [variantProperty], ...possibleVariants} = instance.possibleVariants;

          const possibleVariants = { ...instance.possibleVariants };
          delete possibleVariants[variantProperty];

          // TODO: if there's no more possible variants, assume unique (TODO is also listed above)

          const styleNode: StyleNode = {
            cssProperty: instance.cssProperty,
            cssValue: instance.cssValue,
            // .sort is required here for unique above to work properly
            // TODO: there's an optimization here, if array is always sorted, there must be a way to insert properly
            // TODO: error handling if trying to set if property already exists
            variants: {
              ...instance.variants,
              [variantProperty]: variantValue,
            },
            // variants: [...instance.variants, {
            //   variantProperty, variantValue
            // }].sort((a, b) => `${a.variantProperty}-${a.variantValue}`.localeCompare(`${b.variantProperty}-${b.variantValue}`)),
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

  log(
    "createChildStyleNodes -> ",
    "uniques",
    uniques,
    "next",
    cleanedNestedChildStyleNodes,
  );

  return [...uniques, ...createChildStyleNodes(cleanedNestedChildStyleNodes)];
};

// const breakdown = createChildStyleNodes(styles).sort((a, b) => {
//   return `${a.cssProperty}-${a.cssValue}`.localeCompare(`${b.cssProperty}-${b.cssValue}`)
// });

// log('breakdown', breakdown);

export const convertStyleNodesToCssStylesheet = (
  styleNodes: StyleNode[],
): Record<string, Record<string, string>> => {
  const styleTags: Record<string, Record<string, string>> = {};

  // Group all styles by "className/mixin/utility"
  for (const style of styleNodes) {
    // const key = style.variants.map(variant => `${variant.variantProperty}-${variant.variantValue}`).join('--');
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

// const styleTags: Record<string, Record<string, string>> = {};

// // Group all styles by "className/mixin/utility"
// for (const style of breakdown) {
//   // const key = style.variants.map(variant => `${variant.variantProperty}-${variant.variantValue}`).join('--');
//   const key = Object.entries(style.variants).map(([variantProperty, variantValue]) => `${variantProperty}-${variantValue}`).join('--');

//   styleTags[key] ??= {};
//   if (styleTags[key][style.cssProperty] && styleTags[key][style.cssProperty] !== style.cssValue) {
//     console.error(styleTags[key][style.cssProperty], style.cssValue);
//     throw new Error("Unexpected style exists for combination of variant");
//   }
//   styleTags[key][style.cssProperty] = style.cssValue;
// }

// log('styleTags', styleTags);
