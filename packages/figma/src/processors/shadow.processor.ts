import { StyleProcessor, ProcessedValue, VariableToken } from '../types';
import { rgbaToString } from '../utils';

/**
 * Shadow Effect Processor
 *
 * Extracts DROP_SHADOW and INNER_SHADOW effects from Figma nodes and converts them
 * to CSS box-shadow properties. This processor handles the architectural constraint
 * where only ONE processor can output a given property per node.
 *
 * Architectural Decision:
 * Since both border processor (for INSIDE stroke alignment) and shadow processor
 * need to output box-shadow, the shadow processor detects INSIDE borders and
 * combines them internally. When a node has shadow effects, this processor takes
 * precedence and the border processor returns null for box-shadow.
 */

interface BorderWeights {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BorderColor {
  value: string;
  rawValue: string;
}

interface BorderWidth {
  value: string;
  rawValue: string;
}

export const shadowProcessors: StyleProcessor[] = [
  {
    property: 'box-shadow',
    bindingKey: 'effects',
    process: async (variableTokenMapByProperty, node): Promise<ProcessedValue | null> => {
      // Check if node supports effects
      if (!('effects' in node) || !Array.isArray(node.effects)) {
        return null;
      }

      // Filter for visible shadow effects only (exclude blur effects)
      const shadowEffects = node.effects.filter((effect) => {
        const isShadowType = effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW';
        const isVisible = effect.visible !== false;
        const hasOpacity =
          (effect as DropShadowEffect | InnerShadowEffect).color?.a !== 0 &&
          (effect as DropShadowEffect | InnerShadowEffect).color?.a !== undefined;
        return isShadowType && isVisible && hasOpacity;
      }) as (DropShadowEffect | InnerShadowEffect)[];

      // Check for INSIDE borders that need to be combined with shadow effects
      const hasInsideBorder = 'strokeAlign' in node && node.strokeAlign === 'INSIDE';
      const borderWeights = hasInsideBorder ? getBorderWeights(node) : null;
      const hasBorders = borderWeights && hasAnyBorder(borderWeights);

      // Return null if no shadow effects and no INSIDE borders
      // (border processor will handle INSIDE borders when no shadows exist)
      if (shadowEffects.length === 0 && !hasBorders) {
        return null;
      }

      const shadows: string[] = [];
      const rawShadows: string[] = [];

      // Add INSIDE border shadows first (if present)
      if (hasInsideBorder && hasBorders && borderWeights) {
        const borderColor = getBorderColor(node, variableTokenMapByProperty);
        if (borderColor) {
          const borderShadows = getBorderShadows(
            borderWeights,
            borderColor,
            variableTokenMapByProperty,
          );
          shadows.push(...borderShadows.values);
          rawShadows.push(...borderShadows.rawValues);
        }
      }

      // Add shadow effects
      for (const effect of shadowEffects) {
        const shadowValue = convertEffectToBoxShadow(effect);
        if (shadowValue) {
          shadows.push(shadowValue);
          rawShadows.push(shadowValue);
        }
      }

      // Return null if no shadows were generated
      if (shadows.length === 0) {
        return null;
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
];

/**
 * Convert a Figma shadow effect to CSS box-shadow format
 */
function convertEffectToBoxShadow(effect: DropShadowEffect | InnerShadowEffect): string | null {
  const { offset, radius, color, spread } = effect;
  const isInset = effect.type === 'INNER_SHADOW';

  // Convert RGBA to CSS rgba()
  const colorValue = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a ?? 1})`;

  // Build box-shadow value: [inset] offset-x offset-y blur-radius [spread-radius] color
  const parts = [];
  if (isInset) parts.push('inset');
  parts.push(`${offset?.x || 0}px`);
  parts.push(`${offset?.y || 0}px`);
  parts.push(`${radius || 0}px`);
  if (spread) parts.push(`${spread}px`);
  parts.push(colorValue);

  return parts.join(' ');
}

/**
 * Get border weights from a node (helper for INSIDE border detection)
 */
function getBorderWeights(node: SceneNode): BorderWeights {
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
}

/**
 * Check if node has any borders
 */
function hasAnyBorder(weights: BorderWeights): boolean {
  return weights.top > 0 || weights.right > 0 || weights.bottom > 0 || weights.left > 0;
}

/**
 * Get border color from node
 */
function getBorderColor(
  node: SceneNode,
  variableTokenMapByProperty?: Map<string, VariableToken>,
): BorderColor | null {
  const borderVariable = variableTokenMapByProperty?.get('strokes');
  if (borderVariable) {
    return {
      value: borderVariable.value,
      rawValue: borderVariable.rawValue,
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
}

/**
 * Get border width value
 */
function getBorderWidth(
  property: string,
  width: number,
  variableTokenMapByProperty?: Map<string, VariableToken>,
): BorderWidth {
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
}

/**
 * Generate box-shadow values for INSIDE borders (to be combined with shadow effects)
 */
function getBorderShadows(
  weights: BorderWeights,
  color: BorderColor,
  variableTokenMapByProperty?: Map<string, VariableToken>,
): { values: string[]; rawValues: string[] } {
  const shadows: string[] = [];
  const rawShadows: string[] = [];

  if (weights.top > 0) {
    const topWidth = getBorderWidth('strokeTopWeight', weights.top, variableTokenMapByProperty);
    shadows.push(`inset 0 ${topWidth.value} 0 0 ${color.value}`);
    rawShadows.push(`inset 0 ${topWidth.rawValue} 0 0 ${color.rawValue}`);
  }
  if (weights.right > 0) {
    const rightWidth = getBorderWidth(
      'strokeRightWeight',
      weights.right,
      variableTokenMapByProperty,
    );
    shadows.push(`inset -${rightWidth.value} 0 0 0 ${color.value}`);
    rawShadows.push(`inset -${rightWidth.rawValue} 0 0 0 ${color.rawValue}`);
  }
  if (weights.bottom > 0) {
    const bottomWidth = getBorderWidth(
      'strokeBottomWeight',
      weights.bottom,
      variableTokenMapByProperty,
    );
    shadows.push(`inset 0 -${bottomWidth.value} 0 0 ${color.value}`);
    rawShadows.push(`inset 0 -${bottomWidth.rawValue} 0 0 ${color.rawValue}`);
  }
  if (weights.left > 0) {
    const leftWidth = getBorderWidth('strokeLeftWeight', weights.left, variableTokenMapByProperty);
    shadows.push(`inset ${leftWidth.value} 0 0 0 ${color.value}`);
    rawShadows.push(`inset ${leftWidth.rawValue} 0 0 0 ${color.rawValue}`);
  }

  return { values: shadows, rawValues: rawShadows };
}
