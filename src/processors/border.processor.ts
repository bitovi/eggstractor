import { StyleProcessor, ProcessedValue } from '../types';
import { rgbaToString } from '../utils/index';

interface BorderWeights {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BorderColor {
  value: string;
  rawValue: string;
  variable?: any;
}

interface BorderWidth {
  value: string;
  rawValue: string;
  variable?: any;
}

interface BorderSideConfig {
  weightKey: keyof BorderWeights;
  propertyKey: string;
}

export const borderProcessors: StyleProcessor[] = [
  {
    property: "border",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (!node) return null;

      // For non-rectangular shapes, we don't care about strokeAlign
      const isRectangular = node.type === 'RECTANGLE' || node.type === 'COMPONENT' || node.type === 'INSTANCE';
      if (isRectangular && ('strokeAlign' in node && node.strokeAlign !== 'CENTER' || !('strokeAlign' in node))) {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!shouldUseShorthand(node, weights)) {
        return null;
      }

      const color = getBorderColor(node, variables);
      if (!color) return null;

      // For lines, vectors, and ellipses, use strokeWeight
      const width = node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE'
        ? getBorderWidth('strokeWeight', 'strokeWeight' in node ? Number(node.strokeWeight) : 0, variables)
        : getBorderWidth('strokeTopWeight', weights.top, variables);

      const type = node && 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

      const value = `${width.value} ${type} ${color.value}`;
      const rawValue = `${width.rawValue} ${type} ${color.rawValue}`;

      return {
        value,
        rawValue,
        valueType: "px",
      };
    }
  },
  {
    property: "border-top",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'top', propertyKey: 'strokeTopWeight' },
        variables,
        node,
        processedProperties
      )
  },
  {
    property: "border-right",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'right', propertyKey: 'strokeRightWeight' },
        variables,
        node,
        processedProperties
      )
  },
  {
    property: "border-bottom",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'bottom', propertyKey: 'strokeBottomWeight' },
        variables,
        node,
        processedProperties
      )
  },
  {
    property: "border-left",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode, processedProperties?: Set<string>) =>
      processBorderSide(
        { weightKey: 'left', propertyKey: 'strokeLeftWeight' },
        variables,
        node,
        processedProperties
      )
  },
  {
    property: "outline",
    bindingKey: undefined,
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'strokeAlign' in node && node.strokeAlign !== 'OUTSIDE') {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!hasAnyBorder(weights) || !areAllBordersEqual(weights)) {
        return null;
      }

      const color = getBorderColor(node, variables);
      if (!color) return null;

      const width = getBorderWidth('strokeLeftWeight', Object.values(weights).find(w => w > 0) || 0, variables);
      const type = node && 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

      const value = `${width.value} ${type} ${color.value}`;
      const rawValue = `${width.rawValue} ${type} ${color.rawValue}`;

      return {
        value,
        rawValue,
        valueType: "px",
      };
    }
  },
  {
    property: "box-shadow",
    bindingKey: undefined,
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'strokeAlign' in node && node.strokeAlign !== 'INSIDE') {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!hasAnyBorder(weights)) {
        return null;
      }

      const color = getBorderColor(node, variables);
      if (!color) return null;

      // Get width variables for each side
      const topWidth = getBorderWidth('strokeTopWeight', weights.top, variables);
      const rightWidth = getBorderWidth('strokeRightWeight', weights.right, variables);
      const bottomWidth = getBorderWidth('strokeBottomWeight', weights.bottom, variables);
      const leftWidth = getBorderWidth('strokeLeftWeight', weights.left, variables);

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
        valueType: "px",
      };
    }
  },
  {
    property: "border-radius",
    bindingKey: "cornerRadius",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const radiusVariable = variables.find(v => v.property === 'border-radius');
      if (radiusVariable) {
        return {
          value: radiusVariable.value,
          rawValue: radiusVariable.rawValue
        };
      }

      // Handle ELLIPSE nodes
      if (node?.type === 'ELLIPSE') {
        const EPSILON = 0.00001;
        if (
          !('arcData' in node) ||
          (
            Math.abs(node.arcData.startingAngle - 0) < EPSILON &&
            Math.abs(node.arcData.endingAngle - (2 * Math.PI)) < EPSILON &&
            node.arcData.innerRadius === 0
          )
        ) {
          return { value: '50%', rawValue: '50%' };
        }
        // For partial circles or donuts, don't apply border-radius
        return null;
      }

      // Handle other nodes with cornerRadius
      if (node && 'cornerRadius' in node && node.cornerRadius) {
        const value = `${String(node.cornerRadius)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
];

// Utility functions for border processing
const getBorderWeights = (node?: SceneNode): BorderWeights => {
  if (!node) return { top: 0, right: 0, bottom: 0, left: 0 };

  // For lines, vectors, and ellipses, they use a single strokeWeight
  if (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE') {
    const weight: number = 'strokeWeight' in node ? Number(node.strokeWeight) : 0;
    return {
      top: weight,
      right: weight,
      bottom: weight,
      left: weight
    };
  }

  // For rectangles and other shapes that support individual side weights
  return {
    top: 'strokeTopWeight' in node ? node.strokeTopWeight : 0,
    right: 'strokeRightWeight' in node ? node.strokeRightWeight : 0,
    bottom: 'strokeBottomWeight' in node ? node.strokeBottomWeight : 0,
    left: 'strokeLeftWeight' in node ? node.strokeLeftWeight : 0
  };
};

const hasAnyBorder = (weights: BorderWeights): boolean =>
  weights.top > 0 || weights.right > 0 || weights.bottom > 0 || weights.left > 0;

const hasFullBorder = (weights: BorderWeights): boolean =>
  weights.top > 0 && weights.right > 0 && weights.bottom > 0 && weights.left > 0;

const areAllBordersEqual = (weights: BorderWeights): boolean => {
  const nonZeroWeights = Object.values(weights).filter(w => w !== 0);
  return nonZeroWeights.length > 0 && nonZeroWeights.every(w => w === nonZeroWeights[0]);
};

const shouldUseShorthand = (node?: SceneNode, weights?: BorderWeights): boolean => {
  if (!node || !weights) return false;

  // For lines, vectors, and ellipses, always use shorthand
  if (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE') {
    return hasAnyBorder(weights);
  }

  // For rectangles and other shapes, use original logic
  return hasFullBorder(weights) && areAllBordersEqual(weights);
};

const getBorderColor = (node?: SceneNode, variables?: any[]): BorderColor | null => {
  const borderVariable = variables?.find(v => v.property === 'strokes');
  if (borderVariable) {
    return {
      value: borderVariable.value,
      rawValue: borderVariable.rawValue,
      variable: borderVariable
    };
  }

  if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const stroke = node.strokes[0] as Paint;
    if (stroke?.type === "SOLID") {
      const { r, g, b } = stroke.color;
      const a = stroke.opacity ?? 1;
      const color = rgbaToString(r, g, b, a);
      return {
        value: color,
        rawValue: color
      };
    }
  }
  return null;
};

const getBorderWidth = (property: string, width: number, variables?: any[]): BorderWidth => {
  const widthVariable = variables?.find(v => v.property === property);
  if (widthVariable) {
    return {
      value: widthVariable.value,
      rawValue: widthVariable.rawValue,
    };
  }

  const value = `${String(width)}px`;
  return {
    value,
    rawValue: value
  };
};

const processBorderSide = async (
  config: BorderSideConfig,
  variables: any[],
  node?: SceneNode,
  processedProperties?: Set<string>
): Promise<ProcessedValue | null> => {
  // For lines, vectors, and ellipses, don't process individual sides
  if (node && (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'ELLIPSE')) {
    return null;
  }

  const weights = getBorderWeights(node);

  if (processedProperties?.has('border') ||
    weights[config.weightKey] === 0 ||
    shouldUseShorthand(node, weights)) {
    return null;
  }

  const color = getBorderColor(node, variables);
  if (!color) return null;

  const width = getBorderWidth(config.propertyKey, weights[config.weightKey], variables);
  const type = node && 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

  const value = `${width.value} ${type} ${color.value}`;
  const rawValue = `${width.rawValue} ${type} ${color.rawValue}`;

  return {
    value,
    rawValue,
    valueType: "px",
  };
};