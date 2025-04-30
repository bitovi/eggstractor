import { themeTokens } from "../../theme-tokens";
import { NonNullableStyleToken } from "../../types";

const {
  spacing,
  colors,
  borderWidths,
  borderRadius,
  fontWeight,
  fontFamily,
  fontSize,
} = themeTokens;

const borderStyles = new Set([
  "none",
  "hidden",
  "dotted",
  "dashed",
  "solid",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset",
]);

const borderPropertyToShorthand: Record<string, string> = {
  border: "border",
  "border-top": "border-t",
  "border-right": "border-r",
  "border-bottom": "border-b",
  "border-left": "border-l",
  "border-x": "border-x",
  "border-y": "border-y",
};

const directions = ["t", "r", "b", "l"] as const;

function normalizeFourSides(value: string): [string, string, string, string] {
  const [a, b = a, c = a, d = b] = value.trim().split(/\s+/);

  return [a, b, c, d];
}

function normalizeTwoSides(value: string): [string, string] {
  const [a, b = a] = value.trim().split(/\s+/);

  return [a, b];
}

function normalizeBorderRadius(
  value: string
): [string, string, string, string] {
  const parts = value.trim().split(/\s+/);
  const [a, b = a, c = a, d = b] = parts;

  return parts.length === 3 ? [a, b, c, b] : [a, b, c, d];
}

const normalizeTailwindToken = (
  themeMapping: Record<string, string>,
  value: string
) => {
  return themeMapping[value] ?? `[${value}]`;
};

/*
  Handles rawValue in these formats:
    - "5px"                 → all sides
    - "5px 6px"             → vertical | horizontal
    - "5px 6px 10px"        → top | horizontal | bottom
    - "5px 6px 10px 20px"   → top | right | bottom | left
*/
const generateTailwindPaddingClass: Generator = ({ rawValue }) => {
  return normalizeFourSides(rawValue)
    .map((sizeValue, i) => {
      const normalizedToken = normalizeTailwindToken(spacing, sizeValue);

      return `p${directions[i]}-${normalizedToken}`;
    })
    .join(" ");
};

/*
  Handles rawValue in these formats for gap:
    - "16px"           → both row and column gaps
    - "16px 8px"       → row | column
*/
export const generateTailwindGapClass: Generator = ({ rawValue }) => {
  const axes = ["x", "y"] as const;
  return normalizeTwoSides(rawValue)
    .map((sizeValue, i) => {
      const normalizeToken = normalizeTailwindToken(spacing, sizeValue);
      return `gap-${axes[i]}-${normalizeToken}`;
    })
    .join(" ");
};

function parseBorderShorthand(border: string) {
  const parts = border.trim().split(/\s+/);
  let width: string | undefined;
  let style: string | undefined;
  let color: string | undefined;

  for (const part of parts) {
    if (!width) {
      width = part; // First part is the width
    } else if (!style && borderStyles.has(part)) {
      style = part; // Second part is the border style (from the Set)
    } else if (!color) {
      color = part; // Remaining part is the color
    }
  }

  return { width, style, color };
}

/*
  Handles rawValue in these formats for border-radius:
    - "5px"                   → all corners
    - "5px 10px"              → top-left + bottom-right, top-right + bottom-left
    - "5px 10px 15px"         → top-left, top-right + bottom-left, bottom-right
    - "5px 10px 15px 20px"    → top-left, top-right, bottom-right, bottom-left
*/
const generateTailwindBorderRadiusClass: Generator = ({ rawValue }) => {
  const radiusCorners = ["tl", "tr", "br", "bl"] as const;

  return normalizeBorderRadius(rawValue)
    .map((v) => (v === "0" ? "0px" : v)) //changing 0 to 0px tailwind utility picks it up
    .map((sizeValue, i) => {
      const normalizeToken = normalizeTailwindToken(borderRadius, sizeValue);
      return `rounded-${radiusCorners[i]}-${normalizeToken}`;
    })
    .join(" ");
};

/*
  Handles rawValue in these formats for border:
    - "2px solid #0daeff"     → width | style | color
    - "solid #0daeff"         → style | color (uses default width)
    - "2px #0daeff"           → width | color (uses default style)
*/
const generateTailwindBorderClass: Generator = (token) => {
  const { width, style, color } = parseBorderShorthand(token.rawValue);

  const borderStyle: string = style
    ? `${borderPropertyToShorthand[token.property]}-${style}`
    : "";
  const borderWidth: string = width
    ? `${borderPropertyToShorthand[token.property]}-${normalizeTailwindToken(
        borderWidths,
        width
      )}`
    : "";
  const borderColor: string = color
    ? `${borderPropertyToShorthand[token.property]}-${normalizeTailwindToken(
        colors,
        color
      )}`
    : "";

  return [borderWidth, borderStyle, borderColor].join(" ");
};

/*
  Handles rawValue examples for font family:
    - "Arial, 'Times New Roman', 'Courier New', 'Lucida Console', 'monospace'"
*/
const generateTailwindFontFamilyOutput: Generator = ({ rawValue }) => {
  for (const [category, fallbacks] of Object.entries(fontFamily)) {
    if (category === rawValue) {
      return `font-${category}`;
    }
    for (const fallback of fallbacks) {
      if (fallback === rawValue) {
        return `font-${category}`;
      }
    }
  }
  return `font-[${rawValue}]`;
};

type Generator = (token: NonNullableStyleToken) => string;

const tailwindClassGenerators: Record<string, Generator> = {
  padding: generateTailwindPaddingClass,
  "border-radius": generateTailwindBorderRadiusClass,
  border: generateTailwindBorderClass,
  "font-weight": ({ rawValue }) =>
    `font-${normalizeTailwindToken(fontWeight, rawValue)}`,
  "font-size": ({ rawValue }) =>
    `font-size-${normalizeTailwindToken(fontSize, rawValue)}`,
  "font-family": generateTailwindFontFamilyOutput,
  color: ({ rawValue }) => `text-${normalizeTailwindToken(colors, rawValue)}`,
  background: ({ rawValue }) =>
    `background-${normalizeTailwindToken(colors, rawValue)}`,
  gap: (token) => generateTailwindGapClass(token),
};

export function createTailwindClasses(
  tokens: NonNullableStyleToken[]
): string[] {
  let classOutput: string[] = [];

  for (const token of tokens) {
    const generator = tailwindClassGenerators[token.property];
    if (generator) {
      classOutput.push(generator(token));
    }
  }
  return classOutput;
}
