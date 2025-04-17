import { StyleToken, TokenCollection, TransformerResult } from "../types";
import { groupBy } from "../utils/index";
import { deduplicateMessages } from "../utils/error.utils";
import { themeTokens } from "../theme-tokens";

function generateTailwindPaddingClass(rawTokenValue: string): string {
  //Split padding for multiple directions
  const splitTokenRawValues: string[] = rawTokenValue.split(" ");
  let output = " @apply ";
  splitTokenRawValues.forEach((splitRawValue, index) => {
    let paddingPredicate = "p";
    if (splitTokenRawValues.length === 2) {
      paddingPredicate = index === 0 ? "px" : "py";
    }
    if (splitTokenRawValues.length === 4) {
      switch (index) {
        case 0:
          paddingPredicate = "pt";
          break;
        case 1:
          paddingPredicate = "pr";
          break;
        case 2:
          paddingPredicate = "pb";
          break;
        case 3:
          paddingPredicate = "pl";
          break;
        default:
          paddingPredicate = "p";
      }
    }
    output += themeTokens.spacing[splitRawValue]
      ? `${paddingPredicate}-${themeTokens.spacing[splitRawValue]}`
      : `${paddingPredicate}-[${splitRawValue}]`;
  });
  return output + "\n";
}

function generateTailwindColorClass(
  rawTokenValue: string,
  tokenProperty: string
): string {
  const colorClass: string = tokenProperty === "color" ? "text" : "bg";
  const output = themeTokens.colors[rawTokenValue]
    ? ` @apply ${colorClass}-${themeTokens.colors[rawTokenValue]}\n`
    : ` @apply ${colorClass}-[${rawTokenValue}]\n`;
  return output;
}

function generateTailwindBorderClass(token: StyleToken): string {
  return "";
}

function generateTailwindBoxShadowClass(token: StyleToken): string {
  return "";
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
      classOutput += `\n@mixin ${variantPath} {\n`;
      uniqueTokens.forEach((token) => {
        console.log("uniqueToken", { token });
        if (token.property === "padding") {
          classOutput += generateTailwindPaddingClass(token.rawValue as string);
        }
        if (
          (token.property === "color" || token.property === "background") &&
          token?.rawValue?.includes("#")
        ) {
          classOutput += generateTailwindColorClass(
            token.rawValue as string,
            token.property as string
          );
        }
        if (token.property === "border") {
          classOutput += generateTailwindBorderClass(token);
        }
        if (token.property === "box-shadow") {
          classOutput += generateTailwindBoxShadowClass(token);
        }
      });
      classOutput += "}\n";

      // variableOutput += generatePaddingVariables(figmaVariables);
    }
  });

  return {
    result: variableOutput + classOutput,
    warnings,
    errors,
  };
}
