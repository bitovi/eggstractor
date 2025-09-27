const BORDER_PROPERTIES = [
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

interface Padding<T = string> {
  'padding-top': T;
  'padding-right': T;
  'padding-bottom': T;
  'padding-left': T;
}

interface ParsedShorthand {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

const parseShorthand = (value: string): ParsedShorthand => {
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

const parseBorder = (borderStyleValue: string): string => {
  if (borderStyleValue === 'none') return '0';
  return borderStyleValue.split(' ')[0];
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

  const borderStyle = instance.styles['border'] ? parseBorder(instance.styles['border']) : null;
  const borderTopStyle = instance.styles['border-top']
    ? parseBorder(instance.styles['border-top'])
    : null;
  const borderRightStyle = instance.styles['border-right']
    ? parseBorder(instance.styles['border-right'])
    : null;
  const borderBottomStyle = instance.styles['border-bottom']
    ? parseBorder(instance.styles['border-bottom'])
    : null;
  const borderLeftStyle = instance.styles['border-left']
    ? parseBorder(instance.styles['border-left'])
    : null;

  const borderWidth = instance.styles['border-width']
    ? parseShorthand(instance.styles['border-width'])
    : null;

  const borders = {
    top:
      instance.styles['border-top-width'] || borderWidth?.['top'] || borderTopStyle || borderStyle,
    right:
      instance.styles['border-right-width'] ||
      borderWidth?.['right'] ||
      borderRightStyle ||
      borderStyle,
    bottom:
      instance.styles['border-bottom-width'] ||
      borderWidth?.['bottom'] ||
      borderBottomStyle ||
      borderStyle,
    left:
      instance.styles['border-left-width'] ||
      borderWidth?.['left'] ||
      borderLeftStyle ||
      borderStyle,
  };

  const paddingStyles = instance.styles['padding']
    ? parseShorthand(instance.styles['padding'])
    : null;

  const paddings: Padding<string | null> = {
    'padding-top': instance.styles['padding-top'] || paddingStyles?.['top'] || null,
    'padding-right': instance.styles['padding-right'] || paddingStyles?.['right'] || null,
    'padding-bottom': instance.styles['padding-bottom'] || paddingStyles?.['bottom'] || null,
    'padding-left': instance.styles['padding-left'] || paddingStyles?.['left'] || null,
  };

  // Only add padding properties if they exist
  const newPaddings: { [K in (typeof PADDING_PROPERTIES)[number]]?: string } = {};

  if (paddings['padding-top']) {
    newPaddings['padding-top'] = borders.top
      ? subtract(paddings['padding-top'], borders.top)
      : paddings['padding-top'];
  }

  if (paddings['padding-right']) {
    newPaddings['padding-right'] = borders.right
      ? subtract(paddings['padding-right'], borders.right)
      : paddings['padding-right'];
  }

  if (paddings['padding-bottom']) {
    newPaddings['padding-bottom'] = borders.bottom
      ? subtract(paddings['padding-bottom'], borders.bottom)
      : paddings['padding-bottom'];
  }

  if (paddings['padding-left']) {
    newPaddings['padding-left'] = borders.left
      ? subtract(paddings['padding-left'], borders.left)
      : paddings['padding-left'];
  }

  // If all individual padding properties were used, use padding shorthand as the output
  const newPaddingValues = Object.values(newPaddings);
  const allIndividualValuesUsed =
    newPaddingValues.length === 4 && newPaddingValues.every((value) => !!value);

  // Only add individual or shorthand padding properties if they exist
  const finalizedPaddingStyles: {
    [K in (typeof PADDING_PROPERTIES)[number]]?: string;
  } = {};

  if (allIndividualValuesUsed) {
    finalizedPaddingStyles['padding'] = toPaddingShorthand(newPaddings);
  } else {
    if (instance.styles['padding-top'] && newPaddings['padding-top']) {
      finalizedPaddingStyles['padding-top'] = newPaddings['padding-top'];
    }

    if (instance.styles['padding-right'] && newPaddings['padding-right']) {
      finalizedPaddingStyles['padding-right'] = newPaddings['padding-right'];
    }

    if (instance.styles['padding-bottom'] && newPaddings['padding-bottom']) {
      finalizedPaddingStyles['padding-bottom'] = newPaddings['padding-bottom'];
    }

    if (instance.styles['padding-left'] && newPaddings['padding-left']) {
      finalizedPaddingStyles['padding-left'] = newPaddings['padding-left'];
    }
  }

  // Strip out any existing padding properties to avoid conflicts
  const {
    padding: _p,
    ['padding-top']: _pt,
    ['padding-right']: _pr,
    ['padding-bottom']: _pb,
    ['padding-left']: _pl,
    ...stylesWithoutPadding
  } = instance.styles;

  return {
    ...instance,
    styles: {
      ...stylesWithoutPadding,
      // Merge in the new padding styles
      ...finalizedPaddingStyles,
    },
  };
};
