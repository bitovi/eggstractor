import { StyleToken, TokenCollection, TransformerResult } from "../types";
import { groupBy } from "../utils/index";
import { deduplicateMessages } from "../utils/error.utils";
import { themeTokens } from "../theme-tokens";

const { spacing, colors, borderWidths, borderRadius } = themeTokens;

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
    ? ` ${propertyClass}-${propertyArray[value]}`
    : ` ${propertyClass}-[${value}]`;
}

function generateTailwindPaddingClass(rawTokenValue: string): string {
  //Split padding for multiple directions
  const splitTokenRawValues: string[] = rawTokenValue.split(" ");
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
}

function generateTailwindColorClass(colorClass: string, value: string): string {
  const colorClassNames: Record<string, string> = {
    ...borderPropertyToShorthand,
    color: "text",
    background: "bg",
  };

  return generatePropertyOutput(colors, colorClassNames[colorClass], value);
}

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

function generateTailwindBorderClass(token: StyleToken): string {
  if (token.property === "border-radius") {
    const splitTokenRawValues: string[] = (
      token.rawValue?.split(" ") || []
    ).map((v) => (v === "0" ? "0px" : v));

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
  }

  const { width, style, color } = parseBorderShorthand(
    token.rawValue as string
  );

  const borderStyle: string = style
    ? ` ${borderPropertyToShorthand[token.property]}-${style}`
    : "";
  const borderWidth: string = width
    ? generatePropertyOutput(
        borderWidths,
        borderPropertyToShorthand[token.property],
        width
      )
    : "";
  const borderColor: string = color
    ? generateTailwindColorClass(token.property, color)
    : "";

  return borderWidth + borderStyle + borderColor;
}

export function transformToTailwindScss(
  tokens: TokenCollection
): TransformerResult {
  let variableOutput = "/* Generated Figma variables */\n";
  let classOutput = "/* Generated Tailwind-SCSS */\n";
  // const figmaVariables: { [key: string]: string }[] = [];
  // Deduplicate warnings and errors
  const { warnings, errors } = deduplicateMessages(
    tokens.tokens.filter((token): token is StyleToken => token.type === "style")
  );

  // Filter for style tokens only and ensure they have valid values
  const styleTokens = tokens.tokens.filter(
    (token): token is StyleToken =>
      token.type === "style" &&
      token.value != null &&
      token.value !== "" &&
      token.rawValue != null &&
      token.rawValue !== ""
  );

  const variantGroups = groupBy(styleTokens, (t) => t.path.join("_"));
  Object.entries(variantGroups).forEach(([variantPath, groupTokens]) => {
    if (!variantPath) return;
    // Remove properties with zero values and unnecessary defaults
    const uniqueTokens = groupTokens.reduce((acc, token) => {
      const existing = acc.find((t) => t.property === token.property);
      if (!existing && token.value !== "inherit") {
        // Skip zero values for certain properties
        if (
          ["gap", "padding"].includes(token.property) &&
          (token.value === "0" || token.value === "0px")
        ) {
          return acc;
        }
        // Skip default values
        if (token.property === "border-width" && token.value === "1px") {
          return acc;
        }
        acc.push(token);
      }
      return acc;
    }, [] as StyleToken[]);

    // Only output class if there are non-inherited properties
    if (uniqueTokens.length > 0) {
      classOutput += `\n@mixin ${variantPath} {\n  @apply`;
      uniqueTokens.forEach((token) => {
        if (token.property === "padding") {
          classOutput += generateTailwindPaddingClass(token.rawValue as string);
        }
        if (
          (token.property === "color" || token.property === "background") &&
          token?.rawValue?.includes("#")
        ) {
          classOutput += generateTailwindColorClass(
            token.property as string,
            token.rawValue as string
          );
        }
        if (token.property.includes("border")) {
          classOutput += generateTailwindBorderClass(token);
        }
      });
      classOutput += "\n}\n";
    }
  });

  return {
    result: variableOutput + classOutput,
    warnings,
    errors,
  };
}
