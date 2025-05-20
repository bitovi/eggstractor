import { StyleProcessor, ProcessedValue, VariableToken } from '../types';

interface NodeWithPadding {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

function hasNodePadding(node: SceneNode): node is SceneNode & NodeWithPadding {
  return (
    'paddingTop' in node &&
    'paddingRight' in node &&
    'paddingBottom' in node &&
    'paddingLeft' in node
  );
}

interface PaddingValues {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export const spacingProcessors: StyleProcessor[] = [
  {
    property: 'padding',
    bindingKey: undefined,
    process: async (
      variables: VariableToken[],
      node?: SceneNode,
    ): Promise<ProcessedValue | null> => {
      if (!node || !hasNodePadding(node)) return null;

      // Get pixel values
      const pixelValues: PaddingValues = {
        top: `${node.paddingTop}px`,
        right: `${node.paddingRight}px`,
        bottom: `${node.paddingBottom}px`,
        left: `${node.paddingLeft}px`,
      };

      // Find variable values from passed in variables
      const varValues: Partial<PaddingValues> = {
        top: variables.find((v) => v.property === 'paddingTop')?.value,
        right: variables.find((v) => v.property === 'paddingRight')?.value,
        bottom: variables.find((v) => v.property === 'paddingBottom')?.value,
        left: variables.find((v) => v.property === 'paddingLeft')?.value,
      };

      // Helper to get final value (variable or pixel)
      const getValue = (key: keyof PaddingValues) => varValues[key] || pixelValues[key];

      // Determine the most concise padding format
      if (allEqual([pixelValues.top, pixelValues.right, pixelValues.bottom, pixelValues.left])) {
        // All sides equal - use single value
        return {
          value: getValue('top'),
          rawValue: pixelValues.top,
          valueType: 'px',
        };
      }

      if (pixelValues.top === pixelValues.bottom && pixelValues.left === pixelValues.right) {
        // Vertical/horizontal pairs equal - use two values
        return {
          value: `${getValue('top')} ${getValue('left')}`,
          rawValue: `${pixelValues.top} ${pixelValues.left}`,
          valueType: 'px',
        };
      }

      // All sides different - use four values
      return {
        value: `${getValue('top')} ${getValue('right')} ${getValue('bottom')} ${getValue('left')}`,
        rawValue: `${pixelValues.top} ${pixelValues.right} ${pixelValues.bottom} ${pixelValues.left}`,
        valueType: 'px',
      };
    },
  },
];

function allEqual(values: string[]): boolean {
  return values.every((v) => v === values[0]);
}
