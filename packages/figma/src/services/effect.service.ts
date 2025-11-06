import { VariableToken, TokenCollection } from '../types';
import { sanitizeName } from '../utils';

/**
 * Convert a Figma EffectStyle to a VariableToken
 */
function createEffectStyleToken(effectStyle: EffectStyle): VariableToken | null {
  try {
    // Convert effects array to CSS box-shadow value
    const boxShadowValues = effectStyle.effects
      .filter((effect) => effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW')
      .map((effect) => {
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
      });

    if (boxShadowValues.length === 0) {
      return null;
    }

    const rawValue = boxShadowValues.join(', ');

    return {
      type: 'variable',
      path: [{ name: effectStyle.name, type: 'FRAME' }],
      property: 'box-shadow',
      name: sanitizeName(effectStyle.name),
      value: `$${sanitizeName(effectStyle.name)}`,
      rawValue,
      valueType: null,
      metadata: {
        figmaId: effectStyle.id,
        variableName: effectStyle.name,
        variableTokenType: 'primitive',
      },
    };
  } catch (error) {
    console.warn(`Failed to create token for effect style ${effectStyle.name}:`, error);
    return null;
  }
}

/**
 * Collect all Figma Effect Styles (box-shadow, etc.)
 */
export async function collectAllFigmaEffectStyles(
  collection: TokenCollection,
  onProgress: (progress: number, message: string) => void,
) {
  try {
    onProgress(7, 'Collecting Figma Effect Styles...');
    const effectTokens: VariableToken[] = [];

    // Get all local effect styles
    const effectStyles = await figma.getLocalEffectStylesAsync();

    for (const effectStyle of effectStyles) {
      onProgress(8, `Processing effect style: ${effectStyle.name}`);

      const token = createEffectStyleToken(effectStyle);
      if (token) {
        effectTokens.push(token);
      }
    }

    console.info(`✨ Collected ${effectTokens.length} effect style tokens`);
    collection.tokens.push(...effectTokens);
  } catch (error) {
    console.warn('Failed to collect Figma Effect Styles:', error);
  }
}
