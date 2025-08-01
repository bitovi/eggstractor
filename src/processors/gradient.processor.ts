import { GradientProcessing, VariableToken } from '../types';
import { rgbaToString } from '../utils/color.utils';

export async function processGradientStops(
  stops: readonly ColorStop[],
  variables: VariableToken[],
  nodeId: string,
): Promise<GradientProcessing[]> {
  return Promise.all(
    stops.map(async (stop, index) => {
      const stopVariable = variables.find(
        (v) => v.metadata?.figmaId === `${nodeId}-gradient-stop-${index}`,
      );

      let color;
      if (stopVariable) {
        color = {
          value: stopVariable.value,
          rawValue: stopVariable.rawValue,
        };
      } else {
        const { r, g, b, a } = stop.color;
        const directColor = rgbaToString(r, g, b, a !== undefined ? a : 1);
        color = { value: directColor, rawValue: directColor };
      }

      return {
        value: `${color.value} ${(stop.position * 100).toFixed(2)}%`,
        rawValue: `${color.rawValue} ${(stop.position * 100).toFixed(2)}%`,
      };
    }),
  );
}
