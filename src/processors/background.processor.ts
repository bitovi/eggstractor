import { StyleProcessor, VariableToken, ProcessedValue } from '../types';
import { rgbaToString, normalizeValue } from '../utils';

export const backgroundProcessors: StyleProcessor[] = [
  {
    property: 'background',
    bindingKey: 'fills',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node?: SceneNode,
    ): Promise<ProcessedValue | null> => {
      if (node && 'fills' in node && Array.isArray(node.fills)) {
        const visibleFills = node.fills.filter((fill) => fill.visible);
        if (!visibleFills.length) return null;

        const warningsSet = new Set<string>();
        const errorsSet = new Set<string>();

        const backgrounds = await Promise.all(
          visibleFills.map(async (fill: Paint) => {
            if (fill.type === 'SOLID') {
              const fillVariable = variableTokenMapByProperty.get('fills');
              if (fillVariable) {
                return {
                  value: fillVariable.value,
                  rawValue: fillVariable.rawValue,
                };
              }

              const { r, g, b } = fill.color;
              const a = fill.opacity ?? 1;
              const value = rgbaToString(r, g, b, a);
              return { value, rawValue: value };
            }

            return null;
          }),
        );

        const result: ProcessedValue = {
          warnings: warningsSet.size > 0 ? Array.from(warningsSet) : undefined,
          errors: errorsSet.size > 0 ? Array.from(errorsSet) : undefined,
          value: null,
          rawValue: null,
        };

        const validBackgrounds = backgrounds.filter((b): b is NonNullable<typeof b> => b !== null);
        if (validBackgrounds.length > 0) {
          result.value = validBackgrounds.map((b) => b.value).join(', ');
          result.rawValue = validBackgrounds.map((b) => b.rawValue).join(', ');
        }

        return result;
      }
      return null;
    },
  },
  {
    property: 'opacity',
    bindingKey: 'opacity',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node?: SceneNode,
    ): Promise<ProcessedValue | null> => {
      if (node && 'opacity' in node && node.opacity !== 1) {
        const opacityVariable = variableTokenMapByProperty.get('opacity');
        if (opacityVariable) {
          return {
            value: opacityVariable.value,
            rawValue: opacityVariable.rawValue,
          };
        }

        if (typeof node.opacity === 'number') {
          const value = normalizeValue({
            propertyName: 'opacity',
            value: node.opacity,
          });
          return {
            value,
            rawValue: value,
          };
        }
      }
      return null;
    },
  },
];
