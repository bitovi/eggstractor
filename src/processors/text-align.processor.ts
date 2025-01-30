import { StyleProcessor, ProcessedValue } from '../types';

interface NodeWithTextAlign {
  textAlignHorizontal: string;
}

function hasTextAlign(node: SceneNode): node is SceneNode & NodeWithTextAlign {
  return 'textAlignHorizontal' in node;
}

export const textAlignProcessors: StyleProcessor[] = [
  {
    property: "text-align",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (!node || !hasTextAlign(node)) return null;

      // Map Figma's text align values to CSS values
      const alignmentMap: Record<string, string> = {
        LEFT: 'left',
        CENTER: 'center',
        RIGHT: 'right',
        JUSTIFIED: 'justify'
      };

      const alignment = alignmentMap[node.textAlignHorizontal.toUpperCase()];
      if (!alignment) return null;

      return {
        value: alignment,
        rawValue: alignment
      };
    }
  }
]; 