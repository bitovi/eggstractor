import { BORDER_PROPERTIES, parseBorder } from './utilities';

const PADDING_PROPERTIES = [
  'padding',
  'padding-left',
  'padding-right',
  'padding-top',
  'padding-bottom',
] as const;

interface Padding<T = string> {
  'padding-top': T;
  'padding-right': T;
  'padding-bottom': T;
  'padding-left': T;
}

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
  const finalizedPaddingStyles: { [K in (typeof PADDING_PROPERTIES)[number]]?: string } = {};

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
