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

export function normalizeFourSides(
  value: string
): [string, string, string, string] {
  const [a, b = a, c = a, d = b] = value.trim().split(/\s+/);

  return [a, b, c, d];
}

const flexDirection: Record<string, string> = {
  row: "flex-row",
  "row-reverse": "flex-row-reverse",
  column: "flex-col",
  "column-reverse": "flex-col-reverse",
};

const alignItems: Record<string, string> = {
  stretch: "items-stretch",
  "flex-start": "items-start",
  "flex-end": "items-end",
  center: "items-center",
  baseline: "items-baseline",
};

export function normalizeTwoSides(value: string): [string, string] {
  const [a, b = a] = value.trim().split(/\s+/);

  return [a, b];
}

export function normalizeBorderRadius(
  value: string
): [string, string, string, string] {
  const parts = value.trim().split(/\s+/);
  const [a, b = a, c = a, d = b] = parts;

  return parts.length === 3 ? [a, b, c, b] : [a, b, c, d];
}

export const normalizeTailwindToken = (
  themeMapping: Record<string, string>,
  value: string
) => {
  const mapping = themeMapping[value];
  if (mapping === "DEFAULT") return "";
  return mapping ?? `[${value}]`;
};

/*
  Handles rawValue in these formats:
    - "5px"                 → all sides
    - "5px 6px"             → vertical | horizontal
    - "5px 6px 10px"        → top | horizontal | bottom
    - "5px 6px 10px 20px"   → top | right | bottom | left
*/
export const generateTailwindPaddingClass: Generator = ({ rawValue }) => {
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

export function parseBorderShorthand(border: string) {
  const parts = border.trim().split(/\s+/);
  let width: string | undefined;
  let style: string | undefined;
  let color: string | undefined;

  for (const part of parts) {
    if (!width && part.includes("px")) {
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
export const generateTailwindBorderRadiusClass: Generator = ({ rawValue }) => {
  const radiusCorners = ["tl", "tr", "br", "bl"] as const;

  return normalizeBorderRadius(rawValue)
    .map((v) => (v === "0" ? "0px" : v)) //changing 0 to 0px tailwind utility picks it up
    .map((sizeValue, i) => {
      const normalizedToken = normalizeTailwindToken(borderRadius, sizeValue);
      return normalizedToken
        ? `rounded-${radiusCorners[i]}-${normalizedToken}`
        : `rounded-${radiusCorners[i]}`;
    })
    .join(" ");
};

/*
  Handles rawValue in these formats for border:
    - "2px solid #0daeff"     → width | style | color
    - "solid #0daeff"         → style | color (uses default width)
    - "2px #0daeff"           → width | color (uses default style)
*/
export const generateTailwindBorderClass: Generator = (token) => {
  const { width, style, color } = parseBorderShorthand(token.rawValue);

  const borderResult: string[] = [];
  if (width) {
    const normalizedToken = normalizeTailwindToken(borderWidths, width);
    borderResult.push(
      normalizedToken
        ? `${borderPropertyToShorthand[token.property]}-${normalizedToken}`
        : `${borderPropertyToShorthand[token.property]}`
    );
  }
  if (style) {
    borderResult.push(`${borderPropertyToShorthand[token.property]}-${style}`);
  }

  if (color) {
    borderResult.push(
      `${borderPropertyToShorthand[token.property]}-${normalizeTailwindToken(
        colors,
        color
      )}`
    );
  }

  return borderResult.join(" ");
};

/*
  Handles rawValue examples for font family:
    - "Arial, 'Times New Roman', 'Courier New', 'Lucida Console', 'monospace'"
*/
export const generateTailwindFontFamilyOutput: Generator = ({ rawValue }) => {
  const normalizedRaw = rawValue.replace(/['"]/g, "").toLowerCase();

  for (const [category, fallbacks] of Object.entries(fontFamily)) {
    if (category === normalizedRaw) {
      return `font-${category}`;
    }
    for (const fallback of fallbacks) {
      if (fallback.replace(/['"]/g, "").toLowerCase() === normalizedRaw) {
        return `font-${category}`;
      }
    }
  }

  return `font-[${rawValue}]`;
};

const generateTailwindDisplayClass: Generator = ({ rawValue }) => {
  if (rawValue === "none") {
    return "hidden";
  }
  return rawValue;
};

type Generator = (token: NonNullableStyleToken) => string;

const tailwindClassGenerators: Record<string, Generator> = {
  padding: generateTailwindPaddingClass,
  display: generateTailwindDisplayClass,
  "border-radius": generateTailwindBorderRadiusClass,
  border: generateTailwindBorderClass,
  "font-weight": ({ rawValue }) =>
    `font-${normalizeTailwindToken(fontWeight, rawValue)}`,
  "font-size": ({ rawValue }) =>
    `text-${normalizeTailwindToken(fontSize, rawValue)}`,
  "font-family": generateTailwindFontFamilyOutput,
  color: ({ rawValue }) => `text-${normalizeTailwindToken(colors, rawValue)}`,
  background: ({ rawValue }) =>
    `bg-${normalizeTailwindToken(colors, rawValue)}`,
  gap: (token) => generateTailwindGapClass(token),
  "flex-direction": ({ rawValue }) => flexDirection[rawValue],
  "align-items": ({ rawValue }) => alignItems[rawValue],
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
