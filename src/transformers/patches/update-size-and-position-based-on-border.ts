import { add, BORDER_PROPERTIES, getBorderWidthValues, negative } from './utilities';

const HEIGHT_PROPERTIES = ['height', 'min-height', 'max-height'] as const;

const WIDTH_PROPERTIES = ['width', 'min-width', 'max-width'] as const;

const hasBorderAndWidthOrHeightStyles = <T extends { styles: Record<string, string> }>(
  instance: T,
): boolean => {
  const hasHeightOrWidth = [...HEIGHT_PROPERTIES, ...WIDTH_PROPERTIES].some(
    (prop) => prop in instance.styles,
  );

  if (!hasHeightOrWidth) {
    return false;
  }

  return BORDER_PROPERTIES.some((prop) => prop in instance.styles);
};

type PositionRelativeStyles = 'top' | 'left' | 'position';

export const updateHeightAndWidthStylesBasedOnBorder = <
  T extends {
    styles: {
      [K in
        | (typeof BORDER_PROPERTIES)[number]
        | (typeof HEIGHT_PROPERTIES)[number]
        | (typeof WIDTH_PROPERTIES)[number]
        | PositionRelativeStyles]?: string;
    };
  },
>(
  instance: T,
): T => {
  if (!hasBorderAndWidthOrHeightStyles(instance)) {
    return instance;
  }

  const styles = { ...instance.styles };

  const borders = getBorderWidthValues(instance.styles);

  // Only add height properties if they exist
  (['height', 'min-height', 'max-height'] as const).forEach((prop) => {
    if (styles[prop]) {
      let value = styles[prop];
      if (borders.top) {
        value = add(value, borders.top);
      }
      if (borders.bottom) {
        value = add(value, borders.bottom);
      }
      styles[prop] = value;
    }
  });

  // Only add width properties if they exist
  (['width', 'min-width', 'max-width'] as const).forEach((prop) => {
    if (styles[prop]) {
      let value = styles[prop];
      if (borders.left) {
        value = add(value, borders.left);
      }
      if (borders.right) {
        value = add(value, borders.right);
      }
      styles[prop] = value;
    }
  });

  // Handle shifting position when box-sizing is border-box
  if (styles.position) {
    throw new Error('Missing implementation if position is already set');
  }
  if (styles.left) {
    throw new Error('Missing implementation if left is already set');
  }
  if (styles.top) {
    throw new Error('Missing implementation if top is already set');
  }
  styles.position = 'relative';
  if (borders.left) {
    styles.left = negative(borders.left);
  }
  if (borders.top) {
    styles.top = negative(borders.top);
  }

  return {
    ...instance,
    styles,
  };
};
