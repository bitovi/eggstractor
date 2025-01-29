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

      const warnings: string[] = [];
      const errors: string[] = [];

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

        if (fill.type.startsWith('GRADIENT_')) {
          const result = processGradient(fill as GradientPaint);
          if (result.warnings) warnings.push(...result.warnings);
          if (result.errors) errors.push(...result.errors);
          
          if (result.value) {
            return { 
              value: result.value, 
              rawValue: result.value 
            };
          }
        }

        return null;
      }));

      const result: ProcessedValue = {
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined,
        value: null,
        rawValue: null
      };

      const validBackgrounds = backgrounds.filter((b): b is NonNullable<typeof b> => b !== null);
      if (validBackgrounds.length > 0) {
        result.value = validBackgrounds.map(b => b.value).join(', ');
        result.rawValue = validBackgrounds.map(b => b.rawValue).join(', ');
      }

      return result;
    }
    return null;
  }
};
