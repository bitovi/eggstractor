const fs = require("fs");
const path = require("path");
const culori = require("culori");
const merge = require("lodash.merge");

const defaultTheme = require("tailwindcss/defaultTheme");
const tailwindDefaultColors = require("tailwindcss/colors");
const customConfig = require("../tailwind.config.js");

// Merge defaultTheme + tailwind colors
const defaultThemeWithColors = {
  ...defaultTheme,
  colors: tailwindDefaultColors,
};

// Handle extend properly from custom config
const fullConfig = merge(
  {},
  { theme: defaultThemeWithColors },
  customConfig.theme?.extend
    ? { theme: { ...customConfig.theme.extend } }
    : customConfig
);

const theme = fullConfig.theme;

function remToPx(rem) {
  const numeric = parseFloat(rem);
  return `${numeric * 16}px`; // Tailwind base font size is 16px
}

function flattenSpacingToPxKeys(spacingObj) {
  const result = {};

  for (const [key, value] of Object.entries(spacingObj)) {
    if (typeof value === "string" && value.endsWith("rem")) {
      const px = remToPx(value);
      result[px] = `${key}`;
    } else {
      result[value] = `${key}`; // for cases like 'px' or '0'
    }
  }

  return result;
}

function flattenColorsToHexKeys(colorObj, prefix = "") {
  const result = {};

  for (const [key, value] of Object.entries(colorObj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === "string") {
      try {
        const parsed = culori.parse(value);
        if (parsed) {
          const hex = culori.formatHex(parsed).toLowerCase();
          result[hex] = `${fullKey}`;
        }
      } catch {}
    } else if (typeof value === "object") {
      Object.assign(result, flattenColorsToHexKeys(value, fullKey));
    }
  }

  return result;
}

// Remove unusable color entries
const spacing = theme.spacing || {};
const colors = theme.colors || {};

const spacingToPxMap = flattenSpacingToPxKeys(spacing);
const hexToTailwindClass = flattenColorsToHexKeys(colors);

// Construct the TS output
const tsOutput = `// Auto-generated theme tokens — do not edit manually

export const themeTokens: {
  spacing: Record<string, string>,
  colors: Record<string, string>
} = {
  spacing: ${JSON.stringify(spacingToPxMap, null, 2)},
  colors: ${JSON.stringify(hexToTailwindClass, null, 2)}
};
`;

fs.writeFileSync(path.resolve(__dirname, "../src/theme-tokens.ts"), tsOutput);

console.log("✅ Generated theme-tokens.ts");
