import {
  buildDynamicThemeTokens,
  generateThemeDirective,
  generateSemanticColorUtilities,
} from '../../utils/theme-tokens.utils';
import { TokenCollection, VariableToken } from '../../types';

// Mock console to suppress output during tests
vi.mock('console', () => ({
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

describe('buildDynamicThemeTokens', () => {
  const mockPrimitiveTokens: VariableToken[] = [
    {
      type: 'variable',
      name: 'color-blue-500',
      property: 'color',
      value: '$color-blue-500',
      rawValue: '#0080ff',
      valueType: null,
      path: [],
      metadata: {
        variableId: 'var-1',
        variableName: 'Color/Blue/500',
        variableTokenType: 'primitive',
      },
    },
    {
      type: 'variable',
      name: 'spacing-large',
      property: 'spacing',
      value: '$spacing-large',
      rawValue: '24px',
      valueType: 'px',
      path: [],
      metadata: {
        variableId: 'var-2',
        variableName: 'Spacing/Large',
        variableTokenType: 'primitive',
      },
    },
    {
      type: 'variable',
      name: 'font-weight-medium',
      property: 'font-weight',
      value: '$font-weight-medium',
      rawValue: '500',
      valueType: null,
      path: [],
      metadata: {
        variableId: 'var-3',
        variableName: 'Font Weight/Medium',
        variableTokenType: 'primitive',
      },
    },
    {
      type: 'variable',
      name: 'font-family-gt-america',
      property: 'font-family',
      value: '$font-family-gt-america',
      rawValue: 'GT America',
      valueType: null,
      path: [],
      metadata: {
        variableId: 'var-4',
        variableName: 'Font Family/GT America',
        variableTokenType: 'primitive',
      },
    },
  ];

  it('should build dynamic theme tokens from primitive variable tokens', () => {
    const result = buildDynamicThemeTokens(mockPrimitiveTokens);

    expect(result.colors).toEqual({
      '#0080ff': 'blue-500',
    });

    expect(result.spacing).toEqual({
      '24px': 'large',
    });

    expect(result.fontWeight).toEqual(
      expect.objectContaining({
        '500': 'medium', // From standard mapping
        medium: 'medium', // From token
      }),
    );

    expect(result.fontFamily).toEqual({
      'gt-america': ['GT America'],
    });
  });

  it('should include standard font weight mappings', () => {
    const result = buildDynamicThemeTokens([]);

    // Should always include standard font weight mappings
    expect(result.fontWeight).toEqual({
      '100': 'thin',
      '200': 'extralight',
      '300': 'light',
      '400': 'normal',
      '500': 'medium',
      '600': 'semibold',
      '700': 'bold',
      '800': 'extrabold',
      '900': 'black',
    });
  });

  it('should handle font family tokens with font- prefix', () => {
    const tokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'font-gt-america',
        property: 'font-family',
        value: '$font-gt-america',
        rawValue: 'GT America',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-1',
          variableName: 'Font/GT America',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'font-roboto',
        property: 'font-family',
        value: '$font-roboto',
        rawValue: 'Roboto',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-2',
          variableName: 'Font/Roboto',
          variableTokenType: 'primitive',
        },
      },
    ];

    const result = buildDynamicThemeTokens(tokens);

    expect(result.fontFamily).toEqual({
      'gt-america': ['GT America'],
      roboto: ['Roboto'],
    });
  });

  it('should handle complex token names from real Figma data correctly', () => {
    const complexTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'spacing-border-radius-rounded',
        property: 'spacing', // Figma categorizes as spacing but it's actually border-radius
        value: '$spacing-border-radius-rounded',
        rawValue: '4px',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-complex-1',
          variableName: 'Spacing/Border Radius/Rounded',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'spacing-border-width-border',
        property: 'spacing', // Figma categorizes as spacing but it's actually border-width
        value: '$spacing-border-width-border',
        rawValue: '1px',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-complex-2',
          variableName: 'Spacing/Border Width/Border',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'font-font-weight-400',
        property: 'font-family', // Figma categorizes as font-family but it's actually font-weight
        value: '$font-font-weight-400',
        rawValue: 'regular',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-complex-3',
          variableName: 'Font/Font Weight/400',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'font-gt-america',
        property: 'font-family',
        value: '$font-gt-america',
        rawValue: 'gt america',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-complex-4',
          variableName: 'Font/GT America',
          variableTokenType: 'primitive',
        },
      },
    ];

    const result = buildDynamicThemeTokens(complexTokens);

    // Border radius should be correctly categorized
    expect(result.borderRadius).toEqual({
      '4px': 'rounded',
    });

    // Border width should be correctly categorized
    // When the variable name ends with 'border' (matching the property name), it maps to 'DEFAULT'
    // so Tailwind will use just 'border' class, not 'border-border'
    expect(result.borderWidths).toEqual({
      '1px': 'DEFAULT',
    });

    // Font weight should be correctly categorized and bidirectional
    expect(result.fontWeight).toEqual({
      // Standard mappings
      '100': 'thin',
      '200': 'extralight',
      '300': 'light',
      '400': 'normal',
      '500': 'medium',
      '600': 'semibold',
      '700': 'bold',
      '800': 'extrabold',
      '900': 'black',
      // Custom mapping from complex token name (both raw value and extracted name map to 'normal')
      regular: 'normal',
    });

    // Font family should be correctly categorized
    expect(result.fontFamily).toEqual({
      'gt-america': ['gt america'],
    });

    // Spacing should be empty since all tokens were reclassified
    expect(result.spacing).toEqual({});
  });

  it('should exclude composite tokens from spacing and categorize them correctly', () => {
    const compositeTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'spacing-font-leading-normal',
        property: 'spacing', // Figma categorizes as spacing but it's actually line-height
        value: '$spacing-font-leading-normal',
        rawValue: '1.5',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-leading-1',
          variableName: 'Spacing/Font Leading/Normal',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'spacing-icon-size-sm',
        property: 'spacing', // Figma categorizes as spacing but it's actually icon size
        value: '$spacing-icon-size-sm',
        rawValue: '16px',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-icon-1',
          variableName: 'Spacing/Icon Size/Small',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'spacing-screen-size-lg',
        property: 'spacing', // Figma categorizes as spacing but it's actually screen size
        value: '$spacing-screen-size-lg',
        rawValue: '1024px',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-screen-1',
          variableName: 'Spacing/Screen Size/Large',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'spacing-padding-large',
        property: 'spacing', // This should remain in spacing
        value: '$spacing-padding-large',
        rawValue: '24px',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-spacing-1',
          variableName: 'Spacing/Padding/Large',
          variableTokenType: 'primitive',
        },
      },
    ];

    const result = buildDynamicThemeTokens(compositeTokens);

    // Line height should be correctly categorized
    expect(result.lineHeight).toEqual({
      '1.5': 'normal',
    });

    // Icon size should be correctly categorized
    expect(result.iconSize).toEqual({
      '16px': 'sm',
    });

    // Screen size should be correctly categorized
    expect(result.screenSize).toEqual({
      '1024px': 'lg',
    });

    // Only pure spacing tokens should remain in spacing
    expect(result.spacing).toEqual({
      '24px': 'padding-large',
    });
  });

  it('should handle box-shadow tokens correctly', () => {
    const boxShadowTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'card-shadow',
        property: 'box-shadow',
        value: '$card-shadow',
        rawValue: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'effect-1',
          variableName: 'Card Shadow',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'effect-button-shadow',
        property: 'box-shadow',
        value: '$effect-button-shadow',
        rawValue: 'inset 0px 1px 0px rgba(255, 255, 255, 0.1)',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'effect-2',
          variableName: 'Button Shadow',
          variableTokenType: 'primitive',
        },
      },
    ];

    const result = buildDynamicThemeTokens(boxShadowTokens);

    expect(result.boxShadow).toEqual({
      '0px 4px 8px rgba(0, 0, 0, 0.1)': 'card-shadow',
      'inset 0px 1px 0px rgba(255, 255, 255, 0.1)': 'button-shadow',
    });
  });
});

describe('generateThemeDirective', () => {
  const mockCollection: TokenCollection = {
    tokens: [
      {
        type: 'variable',
        name: 'color-blue-500',
        property: 'color',
        value: '$color-blue-500',
        rawValue: '#0080ff',
        valueType: null,
        path: [],
        metadata: {
          variableId: 'var-1',
          variableName: 'Color/Blue/500',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'spacing-large',
        property: 'spacing',
        value: '$spacing-large',
        rawValue: '24px',
        valueType: 'px',
        path: [],
        metadata: {
          variableId: 'var-2',
          variableName: 'Spacing/Large',
          variableTokenType: 'primitive',
        },
      },
    ],
    components: {},
    componentSets: {},
    instances: {},
  };

  it('should generate basic theme directive with primitive tokens', () => {
    const result = generateThemeDirective(mockCollection);

    expect(result).toContain('@theme {');
    expect(result).toContain('--color-blue-500: #0080ff;');
    expect(result).toContain('--spacing-large: 24px;');
    expect(result).toContain('}');
  });

  it('should include primitives in :root and both primitives and semantics in @theme', () => {
    const collectionWithSemantic: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-primary',
          property: 'color',
          value: '$color-primary',
          rawValue: '#0080ff',
          primitiveRef: 'color-blue-500',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-semantic-1',
            variableName: 'Color/Primary',
            variableTokenType: 'semantic',
          },
        },
        {
          type: 'variable',
          name: 'color-blue-500',
          property: 'color',
          value: '$color-blue-500',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-primitive-1',
            variableName: 'Color/Blue/500',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(collectionWithSemantic);

    // :root should only include primitives
    expect(result).toContain(':root {');
    expect(result).toContain('--color-blue-500: #0080ff;');

    // @theme should include both primitives and semantics with simplified names
    expect(result).toContain('@theme {');
    // Primitives use simplified names (--color-* instead of --colors-*)
    expect(result).toContain('--color-blue-500: var(--color-blue-500);');
    // Semantics should reference primitives (without --color- prefix)
    expect(result).toContain('--primary: var(--color-blue-500);');
  });

  it('should sort tokens naturally (numeric aware)', () => {
    const unsortedCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-blue-10',
          property: 'color',
          value: '$color-blue-10',
          rawValue: '#0066cc',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-1',
            variableName: 'Color/Blue/10',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'color-blue-02',
          property: 'color',
          value: '$color-blue-02',
          rawValue: '#e6f2ff',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-2',
            variableName: 'Color/Blue/02',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'color-blue-01',
          property: 'color',
          value: '$color-blue-01',
          rawValue: '#deebff',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-3',
            variableName: 'Color/Blue/01',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(unsortedCollection);

    // Extract the lines with color variables to check order
    const lines = result.split('\n').filter((line: string) => line.includes('--color-blue-'));

    expect(lines[0]).toContain('--color-blue-01');
    expect(lines[1]).toContain('--color-blue-02');
    expect(lines[2]).toContain('--color-blue-10');
  });

  it('should handle empty token collection', () => {
    const emptyCollection: TokenCollection = {
      tokens: [],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(emptyCollection);

    expect(result).toContain('@theme {');
    expect(result).toContain('}');
    expect(result.split('\n').length).toBe(4); // Header, opening, closing, empty
  });

  it('should handle box-shadow tokens from effect styles', () => {
    const boxShadowCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'card-shadow',
          property: 'box-shadow',
          value: '$card-shadow',
          rawValue: '0px 4px 8px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.05)',
          valueType: null,
          path: [],
          metadata: {
            figmaId: 'effect-1',
            variableName: 'Card Shadow',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'button-shadow',
          property: 'box-shadow',
          value: '$button-shadow',
          rawValue: 'inset 0px 1px 0px rgba(255, 255, 255, 0.1)',
          valueType: null,
          path: [],
          metadata: {
            figmaId: 'effect-2',
            variableName: 'Button Shadow',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(boxShadowCollection);

    expect(result).toContain('@theme {');
    expect(result).toContain(
      '--card-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.05);',
    );
    expect(result).toContain('--button-shadow: inset 0px 1px 0px rgba(255, 255, 255, 0.1);');
    expect(result).toContain('}');
  });

  it('should group tokens by category', () => {
    const mixedCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'font-size-large',
          property: 'font-size',
          value: '$font-size-large',
          rawValue: '18px',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-1',
            variableName: 'Font Size/Large',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'color-blue-500',
          property: 'color',
          value: '$color-blue-500',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-2',
            variableName: 'Color/Blue/500',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'spacing-large',
          property: 'spacing',
          value: '$spacing-large',
          rawValue: '24px',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-3',
            variableName: 'Spacing/Large',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(mixedCollection);

    // Colors should come first, then spacing, then font-size
    const colorIndex = result.indexOf('--color-blue-500');
    const spacingIndex = result.indexOf('--spacing-large');
    const fontSizeIndex = result.indexOf('--font-size-large');

    expect(colorIndex).toBeLessThan(spacingIndex);
    expect(spacingIndex).toBeLessThan(fontSizeIndex);
  });

  it('should exclude composite tokens from spacing and categorize them correctly in theme directive', () => {
    const compositeCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'spacing-font-leading-normal',
          property: 'spacing', // Figma categorizes as spacing but it's actually line-height
          value: '$spacing-font-leading-normal',
          rawValue: '1.5',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-leading-1',
            variableName: 'Spacing/Font Leading/Normal',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'spacing-icon-size-sm',
          property: 'spacing', // Figma categorizes as spacing but it's actually icon size
          value: '$spacing-icon-size-sm',
          rawValue: '16px',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-icon-1',
            variableName: 'Spacing/Icon Size/Small',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'spacing-screen-size-lg',
          property: 'spacing', // Figma categorizes as spacing but it's actually screen size
          value: '$spacing-screen-size-lg',
          rawValue: '1024px',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-screen-1',
            variableName: 'Spacing/Screen Size/Large',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'spacing-padding-large',
          property: 'spacing', // This should remain in spacing
          value: '$spacing-padding-large',
          rawValue: '24px',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-spacing-1',
            variableName: 'Spacing/Padding/Large',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(compositeCollection);

    // Should contain line height tokens
    expect(result).toContain('--line-height-normal: 1.5;');

    // Should contain icon size tokens
    expect(result).toContain('--icon-size-sm: 16px;');

    // Should contain screen size tokens
    expect(result).toContain('--screen-size-lg: 1024px;');

    // Should contain pure spacing tokens
    expect(result).toContain('--spacing-padding-large: 24px;');

    // Should NOT contain composite tokens in spacing
    expect(result).not.toContain('--spacing-font-leading');
    expect(result).not.toContain('--spacing-icon-size');
    expect(result).not.toContain('--spacing-screen-size');
  });

  it('should correctly reference primitive font-family in semantic tokens', () => {
    const fontFamilyCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'base-font-family-inter',
          property: 'font-family',
          value: '$base-font-family-inter',
          rawValue: 'Inter',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-font-prim-1',
            variableName: 'Font/Base/Family/Inter',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'global-font-uidefaultfont',
          property: 'font-family',
          value: '$global-font-uidefaultfont',
          rawValue: 'Inter',
          primitiveRef: 'base-font-family-inter',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-font-sem-1',
            variableName: 'Global/Font/UI Default Font',
            variableTokenType: 'semantic',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(fontFamilyCollection);

    // Primitive font family should use --font-inter
    expect(result).toContain('--font-inter: Inter;');
    // Semantic should also use --font- prefix and reference primitive
    expect(result).toContain('--font-global-font-uidefaultfont: var(--font-inter);');
  });

  it('should correctly reference primitive spacing/size in semantic tokens', () => {
    const spacingCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'base-size-2xs',
          property: 'spacing',
          value: '$base-size-2xs',
          rawValue: '2px',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-spacing-prim-1',
            variableName: 'Size/Base/2XS',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'border-resting',
          property: 'spacing',
          value: '$border-resting',
          rawValue: '2px',
          primitiveRef: 'base-size-2xs',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-border-sem-1',
            variableName: 'Border/Resting',
            variableTokenType: 'semantic',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = generateThemeDirective(spacingCollection);

    // Primitive size should use --spacing-base-size-2xs
    expect(result).toContain('--spacing-base-size-2xs: 2px;');
    // Semantic should also use --spacing- prefix and reference primitive
    expect(result).toContain('--spacing-border-resting: var(--spacing-base-size-2xs);');
  });

  describe('semantic color exclusion from @theme', () => {
    const collectionWithSemanticColors: TokenCollection = {
      tokens: [
        // Primitive colors
        {
          type: 'variable',
          name: 'color-base-blue-500',
          property: 'color',
          value: '$color-base-blue-500',
          rawValue: '#0177cc',
          valueType: null,
          path: [],
          metadata: {
            figmaId: 'var-1',
            variableName: 'base/blue-500',
            variableTokenType: 'primitive',
          },
        },
        // Semantic colors with different name patterns
        {
          type: 'variable',
          name: 'color-action-bg',
          property: 'color',
          value: '$color-action-bg',
          rawValue: '#0177cc',
          valueType: null,
          path: [],
          primitiveRef: 'color-base-blue-500',
          metadata: {
            figmaId: 'var-2',
            variableName: 'action/bg',
            variableTokenType: 'semantic',
          },
        },
        {
          type: 'variable',
          name: 'color-text-default',
          property: 'color',
          value: '$color-text-default',
          rawValue: '#000000',
          valueType: null,
          path: [],
          primitiveRef: 'color-base-black',
          metadata: {
            figmaId: 'var-3',
            variableName: 'text/default',
            variableTokenType: 'semantic',
          },
        },
        {
          type: 'variable',
          name: 'color-border-primary',
          property: 'color',
          value: '$color-border-primary',
          rawValue: '#0177cc',
          valueType: null,
          path: [],
          primitiveRef: 'color-base-blue-500',
          metadata: {
            figmaId: 'var-4',
            variableName: 'border/primary',
            variableTokenType: 'semantic',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    it('should include semantic colors in @theme by default', () => {
      const result = generateThemeDirective(collectionWithSemanticColors, false);

      // Semantic colors should appear in @theme (without --color- prefix)
      expect(result).toContain('--action-bg:');
      expect(result).toContain('--text-default:');
      expect(result).toContain('--border-primary:');
    });

    it('should exclude semantic colors from @theme when flag is true', () => {
      const result = generateThemeDirective(collectionWithSemanticColors, true);

      // Semantic colors should NOT appear in @theme (only in :root)
      const themeSection = result.substring(result.indexOf('@theme'));
      expect(themeSection).not.toContain('--action-bg:');
      expect(themeSection).not.toContain('--text-default:');
      expect(themeSection).not.toContain('--border-primary:');

      // But primitive colors should still be there
      expect(result).toContain('--color-base-blue-500:');
    });

    it('should still include semantic colors in :root even when excluded from @theme', () => {
      const result = generateThemeDirective(collectionWithSemanticColors, true);

      // :root should contain primitives and semantics
      const rootSection = result.substring(0, result.indexOf('@theme'));
      expect(rootSection).toContain('--color-base-blue-500:');
      expect(rootSection).toContain('--action-bg:');
      expect(rootSection).toContain('--text-default:');
      expect(rootSection).toContain('--border-primary:');
    });
  });
});

describe('generateSemanticColorUtilities', () => {
  it('should generate @utility for colors with "bg" in name', () => {
    const semanticTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'color-action-bg',
        property: 'color',
        value: '$color-action-bg',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-1',
          variableName: 'action/bg',
          variableTokenType: 'semantic',
        },
      },
    ];

    const result = generateSemanticColorUtilities(semanticTokens);

    expect(result).toContain('@utility action-bg {');
    expect(result).toContain('background-color: var(--action-bg);');
  });

  it('should generate @utility for colors with "text" in name', () => {
    const semanticTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'color-text-default',
        property: 'color',
        value: '$color-text-default',
        rawValue: '#000000',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-2',
          variableName: 'text/default',
          variableTokenType: 'semantic',
        },
      },
    ];

    const result = generateSemanticColorUtilities(semanticTokens);

    expect(result).toContain('@utility text-default {');
    expect(result).toContain('color: var(--text-default);');
  });

  it('should generate @utility for colors with "border" in name', () => {
    const semanticTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'color-border-primary',
        property: 'color',
        value: '$color-border-primary',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-3',
          variableName: 'border/primary',
          variableTokenType: 'semantic',
        },
      },
    ];

    const result = generateSemanticColorUtilities(semanticTokens);

    expect(result).toContain('@utility border-primary {');
    expect(result).toContain('border-color: var(--border-primary);');
  });

  it('should NOT generate @utility for colors without bg/text/border in name', () => {
    const semanticTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'color-primary',
        property: 'color',
        value: '$color-primary',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-4',
          variableName: 'primary',
          variableTokenType: 'semantic',
        },
      },
    ];

    const result = generateSemanticColorUtilities(semanticTokens);

    // Should not generate any utility for this token
    expect(result).not.toContain('@utility primary {');
  });

  it('should handle multiple semantic colors at once', () => {
    const semanticTokens: VariableToken[] = [
      {
        type: 'variable',
        name: 'color-action-bg',
        property: 'color',
        value: '$color-action-bg',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-1',
          variableName: 'action/bg',
          variableTokenType: 'semantic',
        },
      },
      {
        type: 'variable',
        name: 'color-action-text',
        property: 'color',
        value: '$color-action-text',
        rawValue: '#ffffff',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-2',
          variableName: 'action/text',
          variableTokenType: 'semantic',
        },
      },
      {
        type: 'variable',
        name: 'color-border-default',
        property: 'color',
        value: '$color-border-default',
        rawValue: '#d9d9d9',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-3',
          variableName: 'border/default',
          variableTokenType: 'semantic',
        },
      },
    ];

    const result = generateSemanticColorUtilities(semanticTokens);

    expect(result).toContain('@utility action-bg {');
    expect(result).toContain('background-color: var(--action-bg);');
    expect(result).toContain('@utility action-text {');
    expect(result).toContain('color: var(--action-text);');
    expect(result).toContain('@utility border-default {');
    expect(result).toContain('border-color: var(--border-default);');
  });

  it('should return empty string for empty array', () => {
    const result = generateSemanticColorUtilities([]);
    expect(result).toBe('');
  });
});
