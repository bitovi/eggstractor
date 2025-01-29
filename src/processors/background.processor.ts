import { StyleProcessor, VariableToken, ProcessedValue } from '../types';
import { rgbaToString } from '../utils/color.utils';
import { processGradient } from '../utils/gradient.utils';

export const backgroundProcessor: StyleProcessor = {
  property: "background",
  bindingKey: "fills",
  process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
    if (node && 'fills' in node && Array.isArray(node.fills)) {
      const visibleFills = node.fills.filter(fill => fill.visible);
      if (!visibleFills.length) return null;

      const backgrounds = await Promise.all(visibleFills.map(async (fill: Paint) => {
        if (fill.type === "SOLID") {
          const fillVariable = variables.find(v => v.property === 'fills');
          if (fillVariable) {
            return {
              value: fillVariable.value,
              rawValue: fillVariable.rawValue
            };
          }

          const { r, g, b } = fill.color;
          const a = fill.opacity ?? 1;
          const value = rgbaToString(r, g, b, a);
          return { value, rawValue: value };
        }

        // TODO get gradient working
        if (fill.type.startsWith('GRADIENT_')) {
          const value = processGradient(fill as GradientPaint);
          if (value) {
            return { value, rawValue: value };
          }
        }

        return null;
      }));

      const validBackgrounds = backgrounds.filter((b): b is NonNullable<typeof b> => b !== null);
      if (validBackgrounds.length > 0) {
        return {
          value: validBackgrounds.map(b => b.value).join(', '),
          rawValue: validBackgrounds.map(b => b.rawValue).join(', ')
        };
      }
    }
    return null;
  }
};
