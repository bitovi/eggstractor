const BORDER_PROPERTIES = [
  'border',
  'border-width',
  'border-left-width',
  'border-right-width',
  'border-top-width',
  'border-bottom-width',
] as const;

const PADDING_PROPERTIES = [
  'padding',
  'padding-left',
  'padding-right',
  'padding-top',
  'padding-bottom',
] as const;

type CssUnit = 'px' | 'rem' | 'scss' | 'unknown' | 'none';

type ParsedCssValue =
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

function parseCssValue(text: string): ParsedCssValue {
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
function subtract(padding: string, border: string): string {
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

interface Padding {
  'padding-top': string;
  'padding-right': string;
  'padding-bottom': string;
  'padding-left': string;
}

const parsePadding = (padding: string): Padding => {
  const parts = padding.trim().split(/\s+/);

  switch (parts.length) {
    case 1:
      return {
        'padding-top': parts[0],
        'padding-right': parts[0],
        'padding-bottom': parts[0],
        'padding-left': parts[0],
      };
    case 2:
      return {
        'padding-top': parts[0],
        'padding-right': parts[1],
        'padding-bottom': parts[0],
        'padding-left': parts[1],
      };
    case 3:
      return {
        'padding-top': parts[0],
        'padding-right': parts[1],
        'padding-bottom': parts[2],
        'padding-left': parts[1],
      };
    case 4:
      return {
        'padding-top': parts[0],
        'padding-right': parts[1],
        'padding-bottom': parts[2],
        'padding-left': parts[3],
      };
    default:
      throw new Error('Invalid padding shorthand');
  }
};

function toPaddingShorthand(paddings: Partial<Padding>): string {
  // Default missing sides to "0"
  const top = paddings['padding-top'] ?? '0';
  const right = paddings['padding-right'] ?? '0';
  const bottom = paddings['padding-bottom'] ?? '0';
  const left = paddings['padding-left'] ?? '0';

  // Case 1: all equal
  if (top === right && right === bottom && bottom === left) {
    return top;
  }

  // Case 2: top/bottom same, left/right same
  if (top === bottom && right === left) {
    return `${top} ${right}`;
  }

  // Case 3: left/right same
  if (right === left) {
    return `${top} ${right} ${bottom}`;
  }

  // Case 4: all different
  return `${top} ${right} ${bottom} ${left}`;
}

const hasBorderAndPaddingStyles = <T extends { styles: Record<string, string> }>(
  instance: T,
): boolean => {
  const hasPadding = PADDING_PROPERTIES.some((prop) => prop in instance.styles);

  if (!hasPadding) {
    return false;
  }

  return BORDER_PROPERTIES.some((prop) => prop in instance.styles);
};

const parseBorderWidth = (borderStyleValue: string): string => {
  return borderStyleValue.split(' ')[0] ?? null;
};

export const updatePaddingStylesBasedOnBorder = <
  T extends {
    styles: {
      [K in (typeof BORDER_PROPERTIES)[number] | (typeof PADDING_PROPERTIES)[number]]?: string;
    };
  },
>(
  instance: T,
): T => {
  if (!hasBorderAndPaddingStyles(instance)) {
    return instance;
  }

  const borderStyle = instance.styles['border']
    ? parseBorderWidth(instance.styles['border'])
    : null;

  const borders = {
    top: instance.styles['border-top-width'] || instance.styles['border-width'] || borderStyle,
    right: instance.styles['border-right-width'] || instance.styles['border-width'] || borderStyle,
    bottom:
      instance.styles['border-bottom-width'] || instance.styles['border-width'] || borderStyle,
    left: instance.styles['border-left-width'] || instance.styles['border-width'] || borderStyle,
  };

  const paddingStyles = instance.styles['padding']
    ? parsePadding(instance.styles['padding'])
    : null;

  const paddings = {
    'padding-top': instance.styles['padding-top'] || paddingStyles?.['padding-top'] || null,
    'padding-right': instance.styles['padding-right'] || paddingStyles?.['padding-right'] || null,
    'padding-bottom':
      instance.styles['padding-bottom'] || paddingStyles?.['padding-bottom'] || null,
    'padding-left': instance.styles['padding-left'] || paddingStyles?.['padding-left'] || null,
  };

  // Only add padding properties if they exist
  const newPaddingIndividualValues: { [K in (typeof PADDING_PROPERTIES)[number]]?: string } = {};

  if (paddings['padding-top']) {
    newPaddingIndividualValues['padding-top'] = borders.top
      ? subtract(paddings['padding-top'], borders.top)
      : paddings['padding-top'];
  }

  if (paddings['padding-right']) {
    newPaddingIndividualValues['padding-right'] = borders.right
      ? subtract(paddings['padding-right'], borders.right)
      : paddings['padding-right'];
  }

  if (paddings['padding-bottom']) {
    newPaddingIndividualValues['padding-bottom'] = borders.bottom
      ? subtract(paddings['padding-bottom'], borders.bottom)
      : paddings['padding-bottom'];
  }

  if (paddings['padding-left']) {
    newPaddingIndividualValues['padding-left'] = borders.left
      ? subtract(paddings['padding-left'], borders.left)
      : paddings['padding-left'];
  }

  // If there was padding shorthand, set it as well
  const newPaddingShorthand = paddingStyles ? toPaddingShorthand(newPaddingIndividualValues) : null;

  // Only add individual or shorthand padding properties if they exist
  const newPaddingStyles: { [K in (typeof PADDING_PROPERTIES)[number]]?: string } = {};

  if (instance.styles['padding'] && newPaddingShorthand) {
    newPaddingStyles['padding'] = newPaddingShorthand;
  }

  if (instance.styles['padding-top'] && newPaddingIndividualValues['padding-top']) {
    newPaddingStyles['padding-top'] = newPaddingIndividualValues['padding-top'];
  }

  if (instance.styles['padding-right'] && newPaddingIndividualValues['padding-right']) {
    newPaddingStyles['padding-right'] = newPaddingIndividualValues['padding-right'];
  }

  if (instance.styles['padding-bottom'] && newPaddingIndividualValues['padding-bottom']) {
    newPaddingStyles['padding-bottom'] = newPaddingIndividualValues['padding-bottom'];
  }

  if (instance.styles['padding-left'] && newPaddingIndividualValues['padding-left']) {
    newPaddingStyles['padding-left'] = newPaddingIndividualValues['padding-left'];
  }

  return {
    ...instance,
    styles: {
      ...instance.styles,
      ...newPaddingStyles,
    },
  };
};
