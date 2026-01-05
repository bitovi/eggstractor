import { StyleProcessor, ProcessedValue } from '../types';
import { convertInsideBordersToBoxShadow } from './border.processor';

/**
 * Shadow Effect Processor
 *
 * Extracts DROP_SHADOW and INNER_SHADOW effects from Figma nodes and converts them
 * to CSS box-shadow properties. When shadow effects coexist with INSIDE stroke alignment,
 * this processor combines both into a single box-shadow value.
 *
 * Architecture:
 * - Border processor defers to shadow processor when shadow effects are present
 * - Shadow processor handles combining INSIDE borders with shadow effects
 * - Reuses border processor logic via convertInsideBordersToBoxShadow()
 */

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

      // Return null if no shadow effects - border processor handles INSIDE borders alone
      if (shadowEffects.length === 0) {
        return null;
      }

      const shadows: string[] = [];
      const rawShadows: string[] = [];

      // Check for INSIDE borders that need to be combined with shadow effects
      const insideBorderShadows = convertInsideBordersToBoxShadow(node, variableTokenMapByProperty);
      if (insideBorderShadows) {
        shadows.push(...insideBorderShadows.values);
        rawShadows.push(...insideBorderShadows.rawValues);
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
