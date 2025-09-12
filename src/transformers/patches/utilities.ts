export type CssUnit = 'px' | 'rem' | 'scss' | 'unknown' | 'none';

export type ParsedCssValue =
  | {
      format: 'px' | 'rem' | 'none';
      value: number;
      text: string;
    }
  | {
      value: null;
      format: Exclude<CssUnit, 'px' | 'rem' | 'none'>;
      text: string;
    };

export const BORDER_PROPERTIES = [
  'border',
  'border-left',
  'border-right',
  'border-top',
  'border-bottom',
  'border-width',
  'border-left-width',
  'border-right-width',
  'border-top-width',
  'border-bottom-width',
] as const;

export function parseCssValue(text: string): ParsedCssValue {
  // special case: "0" (no unit needed in CSS)
  if (text === '0' || text === '0px' || text === '0rem') {
    return { value: 0, text: '0', format: 'none' };
  }

  if (text.startsWith('$')) {
    return { value: null, text: `#{${text}}`, format: 'scss' };
  }

  // match numbers with px/rem
  const match = /^(-?\d*\.?\d+)(px|rem)?$/.exec(text);

  if (match) {
    const [, num, unit] = match;
    return {
      value: parseFloat(num),
      text,
      format: unit as 'px' | 'rem',
    };
  }

  // fallback
  return { value: null, text, format: 'unknown' };
}

/**
 * Subtracts border value from padding value, returning a valid CSS string.
 * Padding can never be negative, so the result is clamped at 0.
 */
export function subtract(padding: string, border: string): string {
  const a = parseCssValue(padding);
  const b = parseCssValue(border);

  // first is zero → result is always "0"
  // second is zero → return the original first string as-is
  if (a.value === 0 || b.value === 0) {
    return a.text;
  }

  // same known units → numeric subtraction, clamped at 0
  if (
    a.format === b.format &&
    (a.format === 'px' || a.format === 'rem') &&
    (b.format === 'px' || b.format === 'rem')
  ) {
    const result = Math.max(0, a.value - b.value);
    return result === 0 ? '0' : `${result}${a.format}`;
  }

  // mismatched/unknown units → calc with clamp (no trimming)
  return `calc(${a.text} - ${b.text})`;
}

interface ParsedShorthand {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export const parseShorthand = (value: string): ParsedShorthand => {
  const parts = value.trim().split(/\s+/);

  switch (parts.length) {
    case 1:
      return {
        top: parts[0],
        right: parts[0],
        bottom: parts[0],
        left: parts[0],
      };
    case 2:
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[0],
        left: parts[1],
      };
    case 3:
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[2],
        left: parts[1],
      };
    case 4:
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[2],
        left: parts[3],
      };
    default:
      throw new Error('Invalid shorthand');
  }
};

export const parseBorder = (borderStyleValue: string): string => {
  if (borderStyleValue === 'none') return '0';
  return borderStyleValue.split(' ')[0];
};
