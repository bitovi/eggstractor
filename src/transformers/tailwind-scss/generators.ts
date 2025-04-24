import { themeTokens } from "../../theme-tokens";
import { NonNullableStyleToken } from "../../types";

const { spacing, colors, borderWidths, borderRadius, fontWeight } = themeTokens;

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

function generatePropertyOutput(
  propertyArray: Record<string, string>,
  propertyClass: string,
  value: string
): string {
  return propertyArray[value]
    ? `${propertyClass}-${propertyArray[value]}`
    : `${propertyClass}-[${value}]`;
}

const generateTailwindPaddingClass: Generator = ({ rawValue }) => {
  //Split padding for multiple directions
  const splitTokenRawValues: string[] = rawValue.split(" ");
  let output = "";
  splitTokenRawValues.forEach((splitRawValue, index) => {
    let paddingPrefix = "p";
    if (splitTokenRawValues.length === 2) {
      paddingPrefix = index === 0 ? "px" : "py";
    } else if (splitTokenRawValues.length === 4) {
      const directionMap = ["pt", "pr", "pb", "pl"];
      paddingPrefix = directionMap[index];
    }
    output += generatePropertyOutput(spacing, paddingPrefix, splitRawValue);
  });
  return output;
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

const generateTailwindBorderRadiusClass: Generator = ({ rawValue }) => {
  const splitTokenRawValues: string[] = (rawValue?.split(" ") || []).map((v) =>
    v === "0" ? "0px" : v
  );

  if (splitTokenRawValues.length > 1) {
    const normalized = [
      splitTokenRawValues[0],
      splitTokenRawValues[1] ?? splitTokenRawValues[0],
      splitTokenRawValues[2] ?? splitTokenRawValues[0],
      splitTokenRawValues[3] ??
        splitTokenRawValues[1] ??
        splitTokenRawValues[0],
    ];

    const directions = ["tl", "tr", "br", "bl"];

    return (
      " " +
      normalized
        .map((value, directionIndex) => {
          const direction = directions[directionIndex];

          return borderRadius[value]
            ? `rounded-${direction}-${borderRadius[value]}`
            : `rounded-${direction}-[${value}]`;
        })
        .join(" ")
    );
  } else {
    return generatePropertyOutput(
      borderRadius,
      "rounded",
      splitTokenRawValues[0]
    );
  }
};

const generateTailwindBorderClass: Generator = (token) => {
  const { width, style, color } = parseBorderShorthand(token.rawValue);

  const borderStyle: string = style
    ? `${borderPropertyToShorthand[token.property]}-${style}`
    : "";
  const borderWidth: string = width
    ? generatePropertyOutput(
        borderWidths,
        borderPropertyToShorthand[token.property],
        width
      )
    : "";
  const borderColor: string = color
    ? generatePropertyOutput(
        colors,
        borderPropertyToShorthand[token.property],
        color
      )
    : "";

  return [borderWidth, borderStyle, borderColor].join(" ");
};

type Generator = (token: NonNullableStyleToken) => string;

const tailwindClassGenerators: Record<string, Generator> = {
  padding: generateTailwindPaddingClass,
  "border-radius": generateTailwindBorderRadiusClass,
  border: generateTailwindBorderClass,
  "font-weight": (token) =>
    generatePropertyOutput(fontWeight, "font", token.rawValue),
  color: (token) => generatePropertyOutput(colors, "text", token.rawValue),
  background: (token) =>
    generatePropertyOutput(colors, "background", token.rawValue),
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
