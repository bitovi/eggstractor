import { themeTokens } from '../../theme-tokens';
import { StyleToken } from '../../types';

export type GeneratorToken = {
  rawValue: string;
  property: string;
  path: StyleToken['path'];
};
export type Generator = (token: GeneratorToken) => string;

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
  'none',
  'hidden',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
]);

const borderPropertyToShorthand: Record<string, string> = {
  border: 'border',
  'border-top': 'border-t',
  'border-right': 'border-r',
  'border-bottom': 'border-b',
  'border-left': 'border-l',
  'border-x': 'border-x',
  'border-y': 'border-y',
};

const directions = ['t', 'r', 'b', 'l'] as const;

export function normalizeFourSides(
  value: string,
): [string, string, string, string] {
  const [a, b = a, c = a, d = b] = value.trim().split(/\s+/);

  return [a, b, c, d];
}

const flexDirection: Record<string, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

const alignItems: Record<string, string> = {
  stretch: 'items-stretch',
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
};

const justifyContent: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
};

export function normalizeTwoSides(value: string): [string, string] {
  const [a, b = a] = value.trim().split(/\s+/);

  return [a, b];
}

export function normalizeBorderRadius(
  value: string,
): [string, string, string, string] {
  const parts = value.trim().split(/\s+/);
  const [a, b = a, c = a, d = b] = parts;

  return parts.length === 3 ? [a, b, c, b] : [a, b, c, d];
}

export const normalizeTailwindToken = (
  themeMapping: Record<string, string>,
  value: string,
) => {
  const mapping = themeMapping[value];
  if (mapping === 'DEFAULT') return '';
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
    .join(' ');
};

/*
  Handles rawValue in these formats for gap:
    - "16px"           → both row and column gaps
    - "16px 8px"       → row | column
*/
export const generateTailwindGapClass: Generator = ({ rawValue }) => {
  const axes = ['x', 'y'] as const;
  return normalizeTwoSides(rawValue)
    .map((sizeValue, i) => {
      const normalizeToken = normalizeTailwindToken(spacing, sizeValue);
      return `gap-${axes[i]}-${normalizeToken}`;
    })
    .join(' ');
};

export function parseBorderShorthand(border: string) {
  const parts = border.trim().split(/\s+/);
  let width: string | undefined;
  let style: string | undefined;
  let color: string | undefined;

  for (const part of parts) {
    if (!width && part.includes('px')) {
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
  const radiusCorners = ['tl', 'tr', 'br', 'bl'] as const;
  return normalizeBorderRadius(rawValue)
    .map((v) => (v === '0' ? '0px' : v)) //changing 0 to 0px tailwind utility picks it up
    .map((sizeValue, i) => {
      const normalizedToken = normalizeTailwindToken(borderRadius, sizeValue);

      return normalizedToken
        ? `rounded-${radiusCorners[i]}-${normalizedToken}`
        : `rounded-${radiusCorners[i]}`;
    })
    .join(' ');
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
        : `${borderPropertyToShorthand[token.property]}`,
    );
  }
  if (style) {
    borderResult.push(`${borderPropertyToShorthand[token.property]}-${style}`);
  }

  if (color) {
    borderResult.push(
      `${borderPropertyToShorthand[token.property]}-${normalizeTailwindToken(colors, color)}`,
    );
  }

  return borderResult.join(' ');
};

/*
  Handles rawValue examples for font family:
    - "Arial, 'Times New Roman', 'Courier New', 'Lucida Console', 'monospace'"
*/
export const generateTailwindFontFamilyOutput: Generator = ({ rawValue }) => {
  const normalizedRaw = rawValue.replace(/['"]/g, '').toLowerCase();

  for (const [category, fallbacks] of Object.entries(fontFamily)) {
    if (category === normalizedRaw) {
      return `font-${category}`;
    }
    for (const fallback of fallbacks) {
      if (fallback.replace(/['"]/g, '').toLowerCase() === normalizedRaw) {
        return `font-${category}`;
      }
    }
  }

  return `font-[${rawValue}]`;
};

const generateTailwindDisplayClass: Generator = ({ rawValue }) => {
  if (rawValue === 'none') {
    return 'hidden';
  }
  return rawValue;
};

export const generateTailwindBoxShadowClass: Generator = ({ rawValue }) => {
  // Replace spaces with underscores, but preserve comma separation
  // Split by comma, trim and process each shadow separately, then rejoin
  const cleanValue = rawValue
    .split(',')
    .map((shadow) => shadow.trim().replace(/\s+/g, '_'))
    .join(',');

  return `shadow-[${cleanValue}]`;
};

export const createContextAwareColorGenerator = (
  defaultPrefix: string,
  contextRules: Array<{
    condition: (token: GeneratorToken) => boolean;
    prefix: string;
  }>,
): Generator => {
  return (token) => {
    const matchedRule = contextRules.find((rule) => rule.condition(token));
    const prefix = matchedRule?.prefix || defaultPrefix;

    const normalizedToken = normalizeTailwindToken(colors, token.rawValue);

    return `${prefix}-${normalizedToken}`;
  };
};

/*
  Handles rawValue examples for opacity:
    - "0.5"     → opacity-50
    - "0.75"    → opacity-75
    - "50%"     → opacity-50
*/
export const generateTailwindOpacityClass: Generator = ({ rawValue }) => {
  const opacity = parseFloat(rawValue.replace('%', ''));
  // Handle 0-1 range (0.5) or 0-100 range (50%)
  const normalizedOpacity = rawValue.includes('%')
    ? Math.round(opacity)
    : opacity <= 1
      ? Math.round(opacity * 100)
      : Math.round(opacity);
  return `opacity-${normalizedOpacity}`;
};

const tailwindClassGenerators: Record<string, Generator> = {
  padding: generateTailwindPaddingClass,
  display: generateTailwindDisplayClass,
  'border-radius': generateTailwindBorderRadiusClass,
  border: generateTailwindBorderClass,
  'box-shadow': generateTailwindBoxShadowClass,
  'font-weight': ({ rawValue }) =>
    `font-${normalizeTailwindToken(fontWeight, rawValue)}`,
  'font-size': ({ rawValue }) =>
    `text-${normalizeTailwindToken(fontSize, rawValue)}`,
  'font-family': generateTailwindFontFamilyOutput,
  color: ({ rawValue }) => `text-${normalizeTailwindToken(colors, rawValue)}`,
  background: createContextAwareColorGenerator('bg', [
    {
      condition: (token) =>
        token.path?.some((pathItem) => pathItem.type === 'VECTOR'),
      prefix: 'text',
    },
  ]),
  gap: (token) => generateTailwindGapClass(token),
  'flex-direction': ({ rawValue }) => flexDirection[rawValue],
  'align-items': ({ rawValue }) => alignItems[rawValue],
  'justify-content': ({ rawValue }) => justifyContent[rawValue],
  height: ({ rawValue }) => `h-${normalizeTailwindToken(spacing, rawValue)}`,
  width: ({ rawValue }) => `w-${normalizeTailwindToken(spacing, rawValue)}`,
  'max-height': ({ rawValue }) =>
    `max-h-${normalizeTailwindToken(spacing, rawValue)}`,
  'max-width': ({ rawValue }) =>
    `max-w-${normalizeTailwindToken(spacing, rawValue)}`,
  'min-height': ({ rawValue }) =>
    `min-h-${normalizeTailwindToken(spacing, rawValue)}`,
  'min-width': ({ rawValue }) =>
    `min-w-${normalizeTailwindToken(spacing, rawValue)}`,
  opacity: (token) => generateTailwindOpacityClass(token),
};

export function createTailwindClasses(tokens: GeneratorToken[]): string[] {
  const classOutput: string[] = [];

  for (const token of tokens) {
    const generator = tailwindClassGenerators[token.property];
    if (generator) {
      const result = generator(token);
      classOutput.push(result);
    }
  }
  return classOutput;
}
