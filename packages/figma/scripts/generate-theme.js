const fs = require('fs');
const path = require('path');
const culori = require('culori');
const merge = require('lodash.merge');

const defaultTheme = require('tailwindcss/defaultTheme');
const tailwindDefaultColors = require('tailwindcss/colors');
const customConfig = require('../tailwind.config.js');

// delete deprecated colors from Tailwind
// Using the rest syntax to exclude them leads to warnings
// source: https://github.com/tailwindlabs/tailwindcss/issues/4690#issuecomment-1046087220
delete tailwindDefaultColors.lightBlue;
delete tailwindDefaultColors.warmGray;
delete tailwindDefaultColors.trueGray;
delete tailwindDefaultColors.coolGray;
delete tailwindDefaultColors.blueGray;

// Merge defaultTheme + tailwind colors
const defaultThemeWithColors = {
  ...defaultTheme,
  colors: tailwindDefaultColors,
};

// Handle extend properly from custom config
const fullConfig = merge(
  { theme: defaultThemeWithColors },
  customConfig.theme?.extend
    ? { theme: { ...customConfig.theme.extend } }
    : customConfig,
);

const {
  spacing,
  colors,
  borderRadius,
  borderWidth,
  fontWeight,
  fontSize,
  fontFamily,
  fontStyle,
} = fullConfig.theme;

function remToPx(rem) {
  const numeric = parseFloat(rem);
  return `${numeric * 16}px`; // Tailwind base font size is 16px
}

function flattenPxToKeys(valueKeyObject) {
  const result = {};

  for (const [key, value] of Object.entries(valueKeyObject)) {
    if (typeof value === 'string' && value.endsWith('rem')) {
      const px = remToPx(value);
      result[px] = `${key}`;
    } else {
      result[value] = `${key}`; // for cases like 'px' or '0'
    }
  }

  return result;
}

function flattenValueToKeys(valueKeyObject) {
  const result = {};

  for (const key in valueKeyObject) {
    const value = valueKeyObject[key];
    result[value] = key;
  }

  return result;
}

function flattenColorsToHexKeys(colorObj, prefix = '') {
  let result = {};

  for (const [key, value] of Object.entries(colorObj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'string') {
      try {
        const parsed = culori.parse(value);
        if (parsed) {
          const hex = culori.formatHex(parsed).toLowerCase();
          result[hex] = `${fullKey}`;
        }
      } catch {
        console.warn(`Invalid color: ${value}`, err);
      }
    } else if (typeof value === 'object') {
      result = { ...result, ...flattenColorsToHexKeys(value, fullKey) };
    }
  }

  return result;
}

/*
  From Tailwind, we're grabbing specifically just the font size.
  Some of the values return a font size and line height
  e.g. sm: ['0.875rem', { lineHeight: '1.25rem' }]

  For now, we only want the fontSize.
*/
const fontSizeIndex = 0;
const rawFontSizes = Object.fromEntries(
  Object.entries(fontSize).map(([key, val]) => [
    key,
    Array.isArray(val) ? val[fontSizeIndex] : val,
  ]),
);

const spacingToPxMap = flattenPxToKeys(spacing);

const hexToTailwindClass = flattenColorsToHexKeys(colors);

const borderWidthToPxMap = flattenPxToKeys(borderWidth);
const borderRadiusToPxMap = flattenPxToKeys(borderRadius);

const fontWeightKeystoValues = flattenValueToKeys(fontWeight);
const fontSizePxToKey = flattenPxToKeys(rawFontSizes);

const stringifiedOutput = JSON.stringify(
  {
    spacing: spacingToPxMap,
    colors: hexToTailwindClass,
    borderWidths: borderWidthToPxMap,
    borderRadius: borderRadiusToPxMap,
    fontWeight: fontWeightKeystoValues,
    fontFamily,
    fontSize: fontSizePxToKey,
    fontStyle: fontStyle || {},
  },
  null,
  2,
);

// Construct the TS output
const tsOutput = `// Auto-generated theme tokens — do not edit manually

export const themeTokens: {
  spacing: Record<string, string>,
  colors: Record<string, string>,
  borderWidths: Record<string, string>,
  borderRadius: Record<string, string>,
  fontWeight: Record<string, string>,
  fontFamily: Record<string, string[]>,
  fontSize: Record<string, string>,
  fontStyle: Record<string, string>,
} = ${stringifiedOutput};
`;

fs.writeFileSync(path.resolve(__dirname, '../src/theme-tokens.ts'), tsOutput);

console.log('✅ Generated theme-tokens.ts');
