jest.mock('../../../theme-tokens', () => ({
  themeTokens: {
    colors: {
      '#ffffff': 'white',
      '#507e15': 'green-500',
      '#BA0C2F': 'red-500',
      '#0a1264': 'blue-900',
    },
    spacing: {
      '0px': '0',
      '4px': '1',
      '8px': '2',
      '12px': '3',
      '16px': '4',
      '20px': '5',
      '24px': '6',
      '28px': '7',
      '32px': '8',
      '36px': '9',
      '40px': '10',
      '44px': '11',
      '48px': '12',
      '56px': '14',
      '64px': '16',
      '80px': '20',
      '96px': '24',
      '112px': '28',
      '128px': '32',
      '144px': '36',
      '160px': '40',
      '176px': '44',
      '192px': '48',
      '208px': '52',
      '224px': '56',
      '240px': '60',
      '256px': '64',
      '288px': '72',
      '320px': '80',
      '384px': '96',
      '1px': 'px',
      '2px': '0.5',
      '6px': '1.5',
      '10px': '2.5',
      '14px': '3.5',
    },
    fontFamily: {
      sans: 'sans',
    },
    borderWidths: {
      '1px': 'DEFAULT',
      '2px': '2',
    },
    borderRadius: {
      '4px': 'DEFAULT',
    },
  },
}));

import {
  generateTailwindGapClass,
  normalizeFourSides,
  normalizeBorderRadius,
  normalizeTailwindToken,
  normalizeTwoSides,
  generateTailwindBorderClass,
  generateTailwindBorderRadiusClass,
  generateTailwindFontFamilyOutput,
  generateTailwindPaddingClass,
  generateTailwindBoxShadowClass,
  createContextAwareColorGenerator,
  generateTailwindOpacityClass,
} from '../../../transformers/tailwind/generators';
import { NonNullableStyleToken } from '../../../types';

const basicToken: NonNullableStyleToken = {
  type: 'style',
  name: 'basic',
  value: 'notused 1px',
  rawValue: '10px',
  valueType: 'px',
  property: 'blank',
  path: [
    {
      type: 'FRAME', // Just a random type
      name: 'basic',
    } as SceneNode,
    {
      type: 'FRAME', // Just a random type
      name: 'gap',
    } as SceneNode,
  ],
  metadata: {
    figmaId: 'notapplicable',
  },
  // STUB
  variableTokenMapByProperty: new Map(),
};

describe('normalizeTailwindToken', () => {
  const whateverRecord: Record<string, string> = {
    '5px': 'DEFAULT',
    '10px': 'whatever-2',
  };

  it('should return correct property for given key', () => {
    const result = normalizeTailwindToken(whateverRecord, basicToken.rawValue);
    expect(result).toBe('whatever-2');
  });

  it('should return return responsive utility foe given key if no match found', () => {
    const result = normalizeTailwindToken(whateverRecord, 'not there');
    expect(result).toBe('[not there]');
  });

  it("should return an empty string if key is 'DEFAULT'", () => {
    const result = normalizeTailwindToken(whateverRecord, '5px');
    expect(result).toBe('');
  });
});

describe('normalizeTwoSides', () => {
  it('should return a two string array with the same value if given a string with one value', () => {
    const result = normalizeTwoSides('10px');
    expect(result).toEqual(['10px', '10px']);
  });
  it('should return a two string array a string with two values separated by a space', () => {
    const result = normalizeTwoSides('10px 20px');
    expect(result).toEqual(['10px', '20px']);
  });
});

describe('normalizeFourSides', () => {
  it('should return a four string array with the same value if given a string with one value', () => {
    const result = normalizeFourSides('10px');
    expect(result).toEqual(['10px', '10px', '10px', '10px']);
  });
  it('should return a four string array with two matching values if given a string with two values separated by a space', () => {
    const result = normalizeFourSides('10px 20px');
    expect(result).toEqual(['10px', '20px', '10px', '20px']);
  });

  it('should return a four string array with if given a string with three values separated by a space', () => {
    const result = normalizeFourSides('10px 20px 30px');
    expect(result).toEqual(['10px', '20px', '30px', '20px']);
  });
  it('should return a four string array if given a string with four values separated by a space', () => {
    const result = normalizeFourSides('10px 20px 30px 40px');
    expect(result).toEqual(['10px', '20px', '30px', '40px']);
  });
});

describe('normalizeBorderRadius', () => {
  it('should return a four string array with the same value if given a string with one value', () => {
    const result = normalizeBorderRadius('10px');
    expect(result).toEqual(['10px', '10px', '10px', '10px']);
  });

  it('should return a four string array with values sorted in a diagonal layout for border radius when given a string with two values separated by space', () => {
    const result = normalizeBorderRadius('10px 20px');
    expect(result).toEqual(['10px', '20px', '10px', '20px']);
  });

  it('should return a four string array with if given a string with three values separated by a space', () => {
    const result = normalizeBorderRadius('10px 20px 30px');
    expect(result).toEqual(['10px', '20px', '30px', '20px']);
  });
  it('should return a four string array if given a string with four values separated by a space', () => {
    const result = normalizeBorderRadius('10px 20px 30px 40px');
    expect(result).toEqual(['10px', '20px', '30px', '40px']);
  });
});

describe('generateTailwindPaddingClass', () => {
  const paddingToken = {
    ...basicToken,
    property: 'padding',
    rawValue: '4px',
  };

  it('should return tailwind properties for one padding element', () => {
    const result = generateTailwindPaddingClass(paddingToken);
    expect(result).toBe('pt-1 pr-1 pb-1 pl-1');
  });
  it('should return tailwind properties for four padding element', () => {
    const additionalPaddingToken = {
      ...paddingToken,
      rawValue: '5px 10px 4px 20px',
    };
    const result = generateTailwindPaddingClass(additionalPaddingToken);
    expect(result).toBe('pt-[5px] pr-2.5 pb-1 pl-5');
  });
});

describe('generateTailwindBorderClass', () => {
  const borderToken = {
    ...basicToken,
    property: 'border',
    rawValue: '2px solid #0daeff',
  };
  it('should return tailwind utilities for border width, style, and color', () => {
    const result = generateTailwindBorderClass(borderToken);
    expect(result).toBe('border-2 border-solid border-[#0daeff]');
  });

  it("should return 'border' tailwind utility if key given default value", () => {
    const borderDefaultToken = {
      ...borderToken,
      rawValue: '1px solid #0daeff', // "1px" : "DEFAULT" in borderWidths
    };
    const result = generateTailwindBorderClass(borderDefaultToken);
    expect(result).toBe('border border-solid border-[#0daeff]');
  });
  it('should return tailwind utilities for style and color properly if no width provided', () => {
    const borderTokenNoWidth = {
      ...borderToken,
      rawValue: 'solid #0daeff',
    };
    const result = generateTailwindBorderClass(borderTokenNoWidth);
    expect(result).toBe('border-solid border-[#0daeff]');
  });

  it('should return tailwind utilities for width and color properly if no style provided', () => {
    const borderTokenNoColor = {
      ...borderToken,
      rawValue: '2px #0daeff',
    };
    const result = generateTailwindBorderClass(borderTokenNoColor);
    expect(result).toBe('border-2 border-[#0daeff]');
  });
});

describe('generateTailwindBorderRadiusClass', () => {
  const borderRadiusToken = {
    ...basicToken,
    property: 'border-radius',
    rawValue: '20px',
  };
  it('should return tailwind utilities for border radius when given one property', () => {
    const result = generateTailwindBorderRadiusClass(borderRadiusToken);
    expect(result).toBe('rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px]');
  });

  it('should return tailwind utilities for border radius when given one property', () => {
    const defaultBorderRadiusToken = {
      ...basicToken,
      property: 'border-radius',
      rawValue: '4px', // "1px" : "DEFAULT" in borderRadius
    };
    const result = generateTailwindBorderRadiusClass(defaultBorderRadiusToken);
    expect(result).toBe('rounded-tl rounded-tr rounded-br rounded-bl');
  });

  it('should return tailwind utilities for border radius when given two properties', () => {
    const borderRadiusMultiple = {
      ...borderRadiusToken,
      rawValue: '5px 10px',
    };
    const result = generateTailwindBorderRadiusClass(borderRadiusMultiple);
    expect(result).toBe('rounded-tl-[5px] rounded-tr-[10px] rounded-br-[5px] rounded-bl-[10px]');
  });

  it('should return tailwind utilities for border radius when given three properties', () => {
    const borderRadiusMultiple = {
      ...borderRadiusToken,
      rawValue: '5px 10px 15px',
    };
    const result = generateTailwindBorderRadiusClass(borderRadiusMultiple);
    expect(result).toBe('rounded-tl-[5px] rounded-tr-[10px] rounded-br-[15px] rounded-bl-[10px]');
  });
  it('should return tailwind utilities for border radius when given four properties', () => {
    const borderRadiusMultiple = {
      ...borderRadiusToken,
      rawValue: '5px 10px 15px 20px',
    };
    const result = generateTailwindBorderRadiusClass(borderRadiusMultiple);
    expect(result).toBe('rounded-tl-[5px] rounded-tr-[10px] rounded-br-[15px] rounded-bl-[20px]');
  });
});
describe('generateTailwindFontFamilyOutput', () => {
  const fontToken = {
    ...basicToken,
    property: 'font',
    rawValue: 'sans',
  };
  it('should return tailwind properties for a font family existing element', () => {
    const result = generateTailwindFontFamilyOutput(fontToken);
    expect(result).toBe('font-sans');
  });
  it("should return an arbitrary value for font family if it's not found", () => {
    const notFoundFontToken = {
      ...fontToken,
      rawValue: 'arial',
    };
    const result = generateTailwindFontFamilyOutput(notFoundFontToken);
    expect(result).toBe(`font-[${notFoundFontToken.rawValue}]`);
  });
});

describe('generateTailwindGapClass', () => {
  const gapToken: NonNullableStyleToken = {
    ...basicToken,
    rawValue: '24px',
    property: 'gap',
  };
  it('should return correct tailwind shorthand for single gap value', () => {
    const result = generateTailwindGapClass(gapToken);
    expect(result).toBe('gap-x-6 gap-y-6');
  });

  it('should return correct tailwind shorthand for two gap values (x and y)', () => {
    const twoGapValuesToken = { ...gapToken, rawValue: '24px 16px' };
    const result = generateTailwindGapClass(twoGapValuesToken);
    expect(result).toBe('gap-x-6 gap-y-4');
  });
});

describe('generateTailwindBoxShadowClass', () => {
  const boxShadowToken = {
    ...basicToken,
    property: 'box-shadow',
    rawValue: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  it('should return tailwind shadow with arbitrary value for simple shadow', () => {
    const result = generateTailwindBoxShadowClass(boxShadowToken);
    expect(result).toBe('shadow-[0_4px_6px_rgba(0,0,0,0.1)]');
  });

  it('should handle inset shadows (inside strokes)', () => {
    const insetShadowToken = {
      ...boxShadowToken,
      rawValue: 'inset 0 1px 0 0 #0a1264',
    };
    const result = generateTailwindBoxShadowClass(insetShadowToken);
    expect(result).toBe('shadow-[inset_0_1px_0_0_#0a1264]');
  });

  it('should handle multiple box shadows (complex inside strokes)', () => {
    const multiShadowToken = {
      ...boxShadowToken,
      rawValue:
        'inset 0 1px 0 0 #0a1264, inset -1px 0 0 0 #0a1264, inset 0 -1px 0 0 #0a1264, inset 1px 0 0 0 #0a1264',
    };
    const result = generateTailwindBoxShadowClass(multiShadowToken);
    expect(result).toBe(
      'shadow-[inset_0_1px_0_0_#0a1264,inset_-1px_0_0_0_#0a1264,inset_0_-1px_0_0_#0a1264,inset_1px_0_0_0_#0a1264]',
    );
  });

  it('should handle box shadows with extra spaces', () => {
    const spacedShadowToken = {
      ...boxShadowToken,
      rawValue: '0   4px   6px   rgba(0, 0, 0, 0.1)',
    };
    const result = generateTailwindBoxShadowClass(spacedShadowToken);
    expect(result).toBe('shadow-[0_4px_6px_rgba(0,0,0,0.1)]');
  });

  it('should handle mixed regular and inset shadows', () => {
    const mixedShadowToken = {
      ...boxShadowToken,
      rawValue: '0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 #0a1264',
    };
    const result = generateTailwindBoxShadowClass(mixedShadowToken);
    expect(result).toBe('shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_0_#0a1264]');
  });
});

describe('createContextAwareColorGenerator', () => {
  const vectorToken: NonNullableStyleToken = {
    ...basicToken,
    property: 'background',
    rawValue: '#507e15',
    path: [
      { type: 'FRAME', name: 'modal-dialog' } as SceneNode,
      { type: 'INSTANCE', name: 'icon' } as SceneNode,
      { type: 'VECTOR', name: 'vector' } as SceneNode,
    ],
  };

  const regularToken: NonNullableStyleToken = {
    ...basicToken,
    property: 'background',
    rawValue: '#ffffff',
    path: [
      { type: 'FRAME', name: 'modal-dialog' } as SceneNode,
      { type: 'FRAME', name: 'header' } as SceneNode,
    ],
  };

  it('should use default prefix when no context rules match', () => {
    const generator = createContextAwareColorGenerator('bg', []);
    const result = generator(regularToken);
    expect(result).toBe('bg-white');
  });

  it('should use context rule prefix when condition matches', () => {
    const generator = createContextAwareColorGenerator('bg', [
      {
        condition: (token) => token.path?.some((pathItem) => pathItem.type === 'VECTOR'),
        prefix: 'text',
      },
    ]);

    const result = generator(vectorToken);
    expect(result).toBe('text-green-500');
  });

  it('should use default prefix when context rule condition does not match', () => {
    const generator = createContextAwareColorGenerator('bg', [
      {
        condition: (token) => token.path?.some((pathItem) => pathItem.type === 'VECTOR'),
        prefix: 'text',
      },
    ]);

    const result = generator(regularToken);
    expect(result).toBe('bg-white');
  });

  it('should use first matching context rule when multiple rules exist', () => {
    const generator = createContextAwareColorGenerator('bg', [
      {
        condition: (token) => token.path?.some((pathItem) => pathItem.type === 'VECTOR'),
        prefix: 'text',
      },
      {
        condition: (token) => token.path?.some((pathItem) => pathItem.name?.includes('icon')),
        prefix: 'fill',
      },
    ]);

    const result = generator(vectorToken);
    expect(result).toBe('text-green-500');
  });

  it('should handle tokens without path gracefully', () => {
    const tokenWithoutPath: NonNullableStyleToken = {
      ...basicToken,
      property: 'background',
      rawValue: '#ffffff',
      path: [],
    };

    const generator = createContextAwareColorGenerator('bg', [
      {
        condition: (token) => token.path?.some((pathItem) => pathItem.type === 'VECTOR'),
        prefix: 'text',
      },
    ]);

    const result = generator(tokenWithoutPath);
    expect(result).toBe('bg-white');
  });
});

describe('generateTailwindOpacityClass', () => {
  const opacityToken = {
    ...basicToken,
    property: 'opacity',
    rawValue: '0.5',
  };

  it('should convert decimal opacity to percentage (0.5 -> opacity-50)', () => {
    const result = generateTailwindOpacityClass(opacityToken);
    expect(result).toBe('opacity-50');
  });

  it('should handle percentage opacity (75% -> opacity-75)', () => {
    const percentageToken = {
      ...opacityToken,
      rawValue: '75%',
    };
    const result = generateTailwindOpacityClass(percentageToken);
    expect(result).toBe('opacity-75');
  });

  it('should handle full opacity (1.0 -> opacity-100)', () => {
    const fullOpacityToken = {
      ...opacityToken,
      rawValue: '1.0',
    };
    const result = generateTailwindOpacityClass(fullOpacityToken);
    expect(result).toBe('opacity-100');
  });

  it('should handle zero opacity (0 -> opacity-0)', () => {
    const zeroOpacityToken = {
      ...opacityToken,
      rawValue: '0',
    };
    const result = generateTailwindOpacityClass(zeroOpacityToken);
    expect(result).toBe('opacity-0');
  });

  it('should handle values already in 0-100 range (25 -> opacity-25)', () => {
    const directValueToken = {
      ...opacityToken,
      rawValue: '25',
    };
    const result = generateTailwindOpacityClass(directValueToken);
    expect(result).toBe('opacity-25');
  });

  it('should round decimal values (0.333 -> opacity-33)', () => {
    const decimalToken = {
      ...opacityToken,
      rawValue: '0.333',
    };
    const result = generateTailwindOpacityClass(decimalToken);
    expect(result).toBe('opacity-33');
  });
});
