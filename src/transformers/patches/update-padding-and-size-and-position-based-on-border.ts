import { updateHeightAndWidthStylesBasedOnBorder } from './update-size-and-position-based-on-border';
import { updatePaddingStylesBasedOnBorder } from './update-padding-based-on-border';
import { BORDER_PROPERTIES, divide, getBorderWidthValues } from './utilities';

const hasBorderStyles = <T extends { styles: Record<string, string> }>(instance: T): boolean => {
  return BORDER_PROPERTIES.some((prop) => prop in instance.styles);
};

/**
 * TODO: handle missing @use "sass:math"; at top of file
 *
 * scss escapes don't always work as needed right now, for now manually replace:
 * 1. -math.div(#{$global-size-border-width}, 2); -> math.div($global-size-border-width, -2);
 * 2. math.div(#{$global-size-border-width}, 2); -> #{math.div($global-size-border-width, 2)};
 *
 */
export const updatePaddingAndHeightAndWidthStylesBasedOnBorder = <
  T extends {
    styles: Record<string, string>;
  },
>(
  instance: T,
): T => {
  if (!hasBorderStyles(instance)) {
    return instance;
  }
  // Temporarily divide border widths by 2 to adjust padding and size half as much

  const styles = { ...instance.styles };

  const borders = getBorderWidthValues(instance.styles);

  const tempBorderStyles: { [K in (typeof BORDER_PROPERTIES)[number]]?: string } = {};

  // Used to restore original border widths after updating padding and size
  let previousBorderTopWidth: string | null = null;
  let previousBorderLeftWidth: string | null = null;
  let previousBorderRightWidth: string | null = null;
  let previousBorderBottomWidth: string | null = null;

  if (borders.top) {
    tempBorderStyles['border-top-width'] = divide(borders.top, 2);
    previousBorderTopWidth = styles['border-top-width'] || null;
  }

  if (borders.left) {
    tempBorderStyles['border-left-width'] = divide(borders.left, 2);
    previousBorderLeftWidth = styles['border-left-width'] || null;
  }

  if (borders.right) {
    tempBorderStyles['border-right-width'] = divide(borders.right, 2);
    previousBorderRightWidth = styles['border-right-width'] || null;
  }

  if (borders.bottom) {
    tempBorderStyles['border-bottom-width'] = divide(borders.bottom, 2);
    previousBorderBottomWidth = styles['border-bottom-width'] || null;
  }

  const result = updateHeightAndWidthStylesBasedOnBorder(
    updatePaddingStylesBasedOnBorder({
      ...instance,
      styles: {
        ...styles,
        ...tempBorderStyles,
      },
    }),
  );

  // Patch border widths back to their original values
  if (previousBorderTopWidth) {
    result.styles['border-top-width'] = previousBorderTopWidth;
  } else {
    delete result.styles['border-top-width'];
  }

  if (previousBorderLeftWidth) {
    result.styles['border-left-width'] = previousBorderLeftWidth;
  } else {
    delete result.styles['border-left-width'];
  }

  if (previousBorderRightWidth) {
    result.styles['border-right-width'] = previousBorderRightWidth;
  } else {
    delete result.styles['border-right-width'];
  }

  if (previousBorderBottomWidth) {
    result.styles['border-bottom-width'] = previousBorderBottomWidth;
  } else {
    delete result.styles['border-bottom-width'];
  }

  return result;
};
