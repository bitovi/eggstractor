import {
  transformToCss,
  transformToScss,
  transformToTailwindLayerUtilityClassV4,
  transformToTailwindSassClass,
} from '../../../transformers';
import { groupBy } from '../../../transformers/utils';
import { convertVariantGroupBy } from '../../../transformers/variants';
import { StyleToken, TokenCollection } from '../../../types';
import {
  createNamingContext,
  defaultContextConfig,
  NamingContextConfig,
  rem,
  tailwind4NamingConfig,
} from '../../../utils';
import { tokenCollection } from './convert-variant-group-by-data';

const transform = (token: StyleToken): Record<string, string> => {
  const value =
    token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;

  return {
    [token.property]: value,
  };
};

describe('convertVariantGroupBy', () => {
  let styleTokenCollection: Omit<TokenCollection, 'tokens'> & {
    tokens: StyleToken[];
  };

  const getStyles = (partialConfig: NamingContextConfig) => {
    const styleTokensGroupedByVariantCombination: Record<string, StyleToken[]> =
      groupBy(styleTokenCollection.tokens, (token) => token.name);

    const templateNamingContext = createNamingContext(partialConfig);
    const combinatorialNamingContext = createNamingContext(partialConfig);

    const templateStyles = convertVariantGroupBy(
      styleTokenCollection,
      styleTokensGroupedByVariantCombination,
      transform,
      templateNamingContext,
      false,
    )
      // Remove extra properties for just required properties
      .map((token) => ({
        key: token.key,
        path: token.path,
        styles: token.styles,
        variants: token.variants,
      }));

    const combinatorialStyles = convertVariantGroupBy(
      styleTokenCollection,
      styleTokensGroupedByVariantCombination,
      transform,
      combinatorialNamingContext,
      true,
    )
      // Remove extra properties for just required properties
      .map((token) => ({
        key: token.key,
        path: token.path,
        styles: token.styles,
        variants: token.variants,
      }));

    return { combinatorialStyles, templateStyles };
  };

  beforeEach(() => {
    styleTokenCollection = {
      ...tokenCollection,
      tokens: tokenCollection.tokens
        .filter((token) => token.type === 'style')
        // The padding tokens need to be removed or else the combinatorial
        // styles won't match with template styles
        .filter((token) => token.property !== 'padding'),
    };
  });

  it('should create the same selectors and meta data for both combinatorial and template output', () => {
    const { combinatorialStyles, templateStyles } =
      getStyles(defaultContextConfig);

    expect(combinatorialStyles.length).toBe(4);
    expect(templateStyles.length).toBe(4);

    expect(combinatorialStyles).toStrictEqual(templateStyles);

    const {
      combinatorialStyles: combinatorialStylesTailwind,
      templateStyles: templateStylesTailwind,
    } = getStyles(tailwind4NamingConfig);

    expect(combinatorialStylesTailwind.length).toBe(4);
    expect(templateStylesTailwind.length).toBe(4);

    expect(combinatorialStylesTailwind).toStrictEqual(templateStylesTailwind);

    const {
      combinatorialStyles: combinatorialStylesABCD,
      templateStyles: templateStylesABCD,
    } = getStyles({
      env: 'css',
      delimiters: {
        pathSeparator: '_A_',
        afterComponentName: '_B_',
        variantEqualSign: '_C_',
        betweenVariants: '_D_',
      },
    });

    expect(combinatorialStylesABCD.length).toBe(4);
    expect(templateStylesABCD.length).toBe(4);

    expect(combinatorialStylesABCD).toStrictEqual(templateStylesABCD);
  });

  it('should create the same stylesheets for both combinatorial and template output', () => {
    expect(transformToCss(styleTokenCollection, false)).toStrictEqual(
      transformToCss(styleTokenCollection, true),
    );
    expect(transformToScss(styleTokenCollection, false)).toStrictEqual(
      transformToScss(styleTokenCollection, true),
    );
    expect(
      transformToTailwindSassClass(styleTokenCollection, false),
    ).toStrictEqual(transformToTailwindSassClass(styleTokenCollection, true));
    expect(
      transformToTailwindLayerUtilityClassV4(styleTokenCollection, false),
    ).toStrictEqual(
      transformToTailwindLayerUtilityClassV4(styleTokenCollection, true),
    );
  });
});
