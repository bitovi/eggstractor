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
      if (node && ('strokeAlign' in node && node.strokeAlign !== 'CENTER' || !('strokeAlign' in node))) {
        return null;
      }

      const weights = getBorderWeights(node);
      if (!shouldUseShorthand(weights)) {
        return null;
      }

      const color = getBorderColor(node, variables);
      if (!color) return null;

      const width = getBorderWidth('strokeTopWeight', weights.top, variables);
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

      const width = getBorderWidth('strokeLeftWeight', Object.values(weights).find(w => w > 0), variables);
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

      if (node && 'cornerRadius' in node && node.cornerRadius) {
        const value = `${String(node.cornerRadius)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
]; 

// Utility functions for border processing
const getBorderWeights = (node?: SceneNode): BorderWeights => ({
  top: node && 'strokeTopWeight' in node ? node.strokeTopWeight : 0,
  right: node && 'strokeRightWeight' in node ? node.strokeRightWeight : 0,
  bottom: node && 'strokeBottomWeight' in node ? node.strokeBottomWeight : 0,
  left: node && 'strokeLeftWeight' in node ? node.strokeLeftWeight : 0
});

const hasAnyBorder = (weights: BorderWeights): boolean => 
  weights.top > 0 || weights.right > 0 || weights.bottom > 0 || weights.left > 0;

const hasFullBorder = (weights: BorderWeights): boolean => 
  weights.top > 0 && weights.right > 0 && weights.bottom > 0 && weights.left > 0;

const areAllBordersEqual = (weights: BorderWeights): boolean => {
  const nonZeroWeights = Object.values(weights).filter(w => w !== 0);
  return nonZeroWeights.length > 0 && nonZeroWeights.every(w => w === nonZeroWeights[0]);
};

const shouldUseShorthand = (weights: BorderWeights): boolean => 
  hasFullBorder(weights) && areAllBordersEqual(weights);

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
  const weights = getBorderWeights(node);
  
  // Skip if using shorthand or no border on this side
  if (processedProperties?.has('border') || 
      weights[config.weightKey] === 0 || 
      shouldUseShorthand(weights)) {
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