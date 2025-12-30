import { StyleProcessor, ProcessedValue, VariableToken } from '../types';
import { rgbaToString } from '../utils';

interface BorderWeights {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BorderColor {
  value: string;
  rawValue: string;
  variable?: VariableToken;
}

interface BorderWidth {
  value: string;
  rawValue: string;
  variable?: VariableToken;
}

interface BorderSideConfig {
  weightKey: keyof BorderWeights;
  propertyKey: string;
}

export const borderProcessors: StyleProcessor[] = [
  {
    property: 'border',
    bindingKey: 'strokes',
    process: async (variableTokenMapByProperty, node): Promise<ProcessedValue | null> => {
      // For non-rectangular shapes, we don't care about strokeAlign
      const isRectangular =
        node.type === 'RECTANGLE' || node.type === 'COMPONENT' || node.type === 'INSTANCE';
      if (
        isRectangular &&
        (('strokeAlign' in node && node.strokeAlign !== 'CENTER') || !('strokeAlign' in node))
      ) {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!shouldUseShorthand(node, weights)) {
        return null;
      }

      const color = getBorderColor(node, variableTokenMapByProperty);
      if (!color) return null;

      // For lines, vectors, and ellipses, use strokeWeight
      const width =
        node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE'
          ? getBorderWidth(
              'strokeWeight',
              'strokeWeight' in node ? Number(node.strokeWeight) : 0,
              variableTokenMapByProperty,
            )
          : getBorderWidth('strokeTopWeight', weights.top, variableTokenMapByProperty);

      const type = 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

      const value = `${width.value} ${type} ${color.value}`;
      const rawValue = `${width.rawValue} ${type} ${color.rawValue}`;

      return {
        value,
        rawValue,
        valueType: 'px',
      };
    },
  },
  {
    property: 'border-top',
    bindingKey: 'strokes',
    process: async (variableTokenMapByProperty, node, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'top', propertyKey: 'strokeTopWeight' },
        variableTokenMapByProperty,
        node,
        processedProperties,
      ),
  },
  {
    property: 'border-right',
    bindingKey: 'strokes',
    process: async (variableTokenMapByProperty, node, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'right', propertyKey: 'strokeRightWeight' },
        variableTokenMapByProperty,
        node,
        processedProperties,
      ),
  },
  {
    property: 'border-bottom',
    bindingKey: 'strokes',
    process: async (variableTokenMapByProperty, node, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'bottom', propertyKey: 'strokeBottomWeight' },
        variableTokenMapByProperty,
        node,
        processedProperties,
      ),
  },
  {
    property: 'border-left',
    bindingKey: 'strokes',
    process: async (variableTokenMapByProperty, node, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'left', propertyKey: 'strokeLeftWeight' },
        variableTokenMapByProperty,
        node,
        processedProperties,
      ),
  },
  {
    property: 'outline',
    bindingKey: undefined,
    process: async (variableTokenMapByProperty, node): Promise<ProcessedValue | null> => {
      if ('strokeAlign' in node && node.strokeAlign !== 'OUTSIDE') {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!hasAnyBorder(weights) || !areAllBordersEqual(weights)) {
        return null;
      }

      const color = getBorderColor(node, variableTokenMapByProperty);
      if (!color) return null;

      const width = getBorderWidth(
        'strokeLeftWeight',
        Object.values(weights).find((w) => w > 0) || 0,
        variableTokenMapByProperty,
      );
      const type = 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

      const value = `${width.value} ${type} ${color.value}`;
      const rawValue = `${width.rawValue} ${type} ${color.rawValue}`;

      // TODO(TECHNICAL-DEBT): This pre-formatting is a temporary workaround for EGG-132.
      // The proper solution requires restructuring the entire token pipeline to use
      // structured value types (TokenValuePart union types) instead of string concatenation.
      // This would eliminate the need for both `value` and the pre-formatted fields below.
      // See: https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+EGG-132+Border+Token+Pipeline
      // Estimated effort: 3-4 weeks.
      //
      // Pre-format values for transformers to avoid string parsing
      // Format: <width> <style> <color> where style is always a CSS keyword
      const widthForCss = width.value || width.rawValue;
      const widthForScss = width.value ? `$${width.value}` : width.rawValue;
      const colorForCss = color.value ? `var(--${color.value})` : color.rawValue;
      const colorForScss = color.value ? `$${color.value}` : color.rawValue;

      return {
        value,
        rawValue,
        cssValue: `${widthForCss} ${type} ${colorForCss}`,
        scssValue: `${widthForScss} ${type} ${colorForScss}`,
        valueType: 'px',
      };
    },
  },
  {
    property: 'box-shadow',
    bindingKey: undefined,
    process: async (variableTokenMapByProperty, node): Promise<ProcessedValue | null> => {
      if ('strokeAlign' in node && node.strokeAlign !== 'INSIDE') {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!hasAnyBorder(weights)) {
        return null;
      }

      const color = getBorderColor(node, variableTokenMapByProperty);
      if (!color) return null;

      // Get width variables for each side
      const topWidth = getBorderWidth('strokeTopWeight', weights.top, variableTokenMapByProperty);
      const rightWidth = getBorderWidth(
        'strokeRightWeight',
        weights.right,
        variableTokenMapByProperty,
      );
      const bottomWidth = getBorderWidth(
        'strokeBottomWeight',
        weights.bottom,
        variableTokenMapByProperty,
      );
      const leftWidth = getBorderWidth(
        'strokeLeftWeight',
        weights.left,
        variableTokenMapByProperty,
      );

      const shadows = [];
      const rawShadows = [];

      if (weights.top > 0) {
        shadows.push(`inset 0 ${topWidth.value} 0 0 ${color.value}`);
        rawShadows.push(`inset 0 ${topWidth.rawValue} 0 0 ${color.rawValue}`);
      }
      if (weights.right > 0) {
        shadows.push(`inset -${rightWidth.value} 0 0 0 ${color.value}`);
        rawShadows.push(`inset -${rightWidth.rawValue} 0 0 0 ${color.rawValue}`);
      }
      if (weights.bottom > 0) {
        shadows.push(`inset 0 -${bottomWidth.value} 0 0 ${color.value}`);
        rawShadows.push(`inset 0 -${bottomWidth.rawValue} 0 0 ${color.rawValue}`);
      }
      if (weights.left > 0) {
        shadows.push(`inset ${leftWidth.value} 0 0 0 ${color.value}`);
        rawShadows.push(`inset ${leftWidth.rawValue} 0 0 0 ${color.rawValue}`);
      }

      const value = shadows.join(', ');
      const rawValue = rawShadows.join(', ');

      return {
        value,
        rawValue,
        valueType: 'px',
      };
    },
  },
  {
    property: 'border-radius',
    bindingKey: undefined,
    process: async (variableTokenMapByProperty, node): Promise<ProcessedValue | null> => {
      // Handle ELLIPSE nodes
      if (node?.type === 'ELLIPSE') {
        const EPSILON = 0.00001;
        if (
          !('arcData' in node) ||
          (Math.abs(node.arcData.startingAngle - 0) < EPSILON &&
            Math.abs(node.arcData.endingAngle - 2 * Math.PI) < EPSILON &&
            node.arcData.innerRadius === 0)
        ) {
          return { value: '50%', rawValue: '50%', valueType: '%' };
        }
        return null;
      }

      // Handle nodes with cornerRadius
      const radii = getCornerRadii(node, variableTokenMapByProperty);
      if (!radii) return null;

      return {
        value: radii.values.join(' '),
        rawValue: radii.rawValues.join(' '),
        valueType: radii.valueType,
      };
    },
  },
];

// Utility functions for border processing
const getBorderWeights = (node: SceneNode): BorderWeights => {
  // For lines, vectors, and ellipses, they use a single strokeWeight
  if (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE') {
    const weight: number = 'strokeWeight' in node ? Number(node.strokeWeight) : 0;
    return {
      top: weight,
      right: weight,
      bottom: weight,
      left: weight,
    };
  }

  // For rectangles and other shapes that support individual side weights
  return {
    top: 'strokeTopWeight' in node ? node.strokeTopWeight : 0,
    right: 'strokeRightWeight' in node ? node.strokeRightWeight : 0,
    bottom: 'strokeBottomWeight' in node ? node.strokeBottomWeight : 0,
    left: 'strokeLeftWeight' in node ? node.strokeLeftWeight : 0,
  };
};

const hasAnyBorder = (weights: BorderWeights): boolean =>
  weights.top > 0 || weights.right > 0 || weights.bottom > 0 || weights.left > 0;

const hasFullBorder = (weights: BorderWeights): boolean =>
  weights.top > 0 && weights.right > 0 && weights.bottom > 0 && weights.left > 0;

const areAllBordersEqual = (weights: BorderWeights): boolean => {
  const nonZeroWeights = Object.values(weights).filter((w) => w !== 0);
  return nonZeroWeights.length > 0 && nonZeroWeights.every((w) => w === nonZeroWeights[0]);
};

const shouldUseShorthand = (node: SceneNode, weights?: BorderWeights): boolean => {
  if (!weights) return false;

  // For lines, vectors, and ellipses, always use shorthand
  if (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE') {
    return hasAnyBorder(weights);
  }

  // For rectangles and other shapes, use original logic
  return hasFullBorder(weights) && areAllBordersEqual(weights);
};

const getBorderColor = (
  node: SceneNode,
  variableTokenMapByProperty?: Map<string, VariableToken>,
): BorderColor | null => {
  const borderVariable = variableTokenMapByProperty?.get('strokes');
  if (borderVariable) {
    return {
      value: borderVariable.value,
      rawValue: borderVariable.rawValue,
      variable: borderVariable,
    };
  }

  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const stroke = node.strokes[0] as Paint;
    if (stroke?.type === 'SOLID') {
      const { r, g, b } = stroke.color;
      const a = stroke.opacity ?? 1;
      const color = rgbaToString(r, g, b, a);
      return {
        value: color,
        rawValue: color,
      };
    }
  }
  return null;
};

const getBorderWidth = (
  property: string,
  width: number,
  variableTokenMapByProperty?: Map<string, VariableToken>,
): BorderWidth => {
  const widthVariable = variableTokenMapByProperty?.get(property);
  if (widthVariable) {
    return {
      value: widthVariable.value,
      rawValue: widthVariable.rawValue,
    };
  }

  const value = `${String(width)}px`;
  return {
    value,
    rawValue: value,
  };
};

const processBorderSide = async (
  config: BorderSideConfig,
  variableTokenMapByProperty: Map<string, VariableToken>,
  node: SceneNode,
  processedProperties?: Set<string>,
): Promise<ProcessedValue | null> => {
  // For lines, vectors, and ellipses, don't process individual sides
  if (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE') {
    return null;
  }

  const weights = getBorderWeights(node);

  if (
    processedProperties?.has('border') ||
    weights[config.weightKey] === 0 ||
    shouldUseShorthand(node, weights)
  ) {
    return null;
  }

  const color = getBorderColor(node, variableTokenMapByProperty);
  if (!color) return null;

  const width = getBorderWidth(
    config.propertyKey,
    weights[config.weightKey],
    variableTokenMapByProperty,
  );
  const type = 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

  const value = `${width.value} ${type} ${color.value}`;
  const rawValue = `${width.rawValue} ${type} ${color.rawValue}`;

  return {
    value,
    rawValue,
    valueType: 'px',
  };
};

// Add this utility function near the other utility functions
const getCornerRadii = (
  node: SceneNode,
  variableTokenMapByProperty?: Map<string, VariableToken>,
) => {
  if (
    !('topRightRadius' in node) &&
    !('bottomRightRadius' in node) &&
    !('bottomLeftRadius' in node) &&
    !('topLeftRadius' in node)
  ) {
    return null;
  }

  // Handle variables first
  const cornerVars = [
    variableTokenMapByProperty?.get('topLeftRadius'),
    variableTokenMapByProperty?.get('topRightRadius'),
    variableTokenMapByProperty?.get('bottomRightRadius'),
    variableTokenMapByProperty?.get('bottomLeftRadius'),
  ];

  if (cornerVars.some((v) => v)) {
    const cssValues = cornerVars.map((v) => v?.value || '0');
    const rawValues = cornerVars.map((v) => v?.rawValue || '0');
    if (cssValues.every((v) => v === '0')) return null;

    const valueType = rawValues.find((v) => v !== '0')?.includes('%') ? '%' : 'px';
    return optimizeRadiusValues(cssValues, rawValues, valueType);
  }

  // Handle node values
  const corners = [
    'topLeftRadius' in node ? (node.topLeftRadius as number) : 0,
    'topRightRadius' in node ? (node.topRightRadius as number) : 0,
    'bottomRightRadius' in node ? (node.bottomRightRadius as number) : 0,
    'bottomLeftRadius' in node ? (node.bottomLeftRadius as number) : 0,
  ];

  if (corners.every((r) => !r)) return null;

  const cssValues = corners.map((radius) => (radius ? `${Math.round(radius)}px` : '0'));

  const valueType = cssValues.find((v) => v !== '0')?.includes('%') ? '%' : 'px';
  return optimizeRadiusValues(cssValues, cssValues, valueType);
};

const optimizeRadiusValues = (values: string[], rawValues: string[], valueType: 'px' | '%') => {
  // If all values are the same, return single value
  if (rawValues.every((v) => v === rawValues[0])) {
    return {
      values: [values[0]],
      rawValues: [rawValues[0]],
      valueType,
    };
  }

  // Check for top-left-and-bottom-right | top-right-and-bottom-left pattern
  if (rawValues[0] === rawValues[2] && rawValues[1] === rawValues[3]) {
    return {
      values: [values[0], values[1]],
      rawValues: [rawValues[0], rawValues[1]],
      valueType,
    };
  }

  // Check for top-left | top-right-and-bottom-left | bottom-right pattern
  if (rawValues[1] === rawValues[3]) {
    return {
      values: [values[0], values[1], values[2]],
      rawValues: [rawValues[0], rawValues[1], rawValues[2]],
      valueType,
    };
  }

  // Return all four values if no pattern matches
  return {
    values,
    rawValues,
    valueType,
  };
};
