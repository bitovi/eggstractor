import { StyleProcessor, VariableToken, ProcessedValue } from '../types';
import { rgbaToString } from '../utils/color.utils';

interface NodeWithFont {
  fontSize?: number;
  fontName?: FontName;
  fontWeight?: number;  // Direct API property
  lineHeight?: LineHeight | number;
  letterSpacing?: LetterSpacing | number;
}

function hasFont(node: SceneNode): node is SceneNode & NodeWithFont {
  return 'fontSize' in node || 'fontName' in node || 'fontWeight' in node;
}

export const fontProcessors: StyleProcessor[] = [
  {
    property: "color",
    bindingKey: "fills",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const colorVariable = variables.find(v => v.property === 'fills');
      if (colorVariable) {
        return {
          value: colorVariable.value,
          rawValue: colorVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
        const fill = node.fills[0] as Paint;
        if (fill?.type === "SOLID") {
          const { r, g, b } = fill.color;
          const a = fill.opacity ?? 1;
          const value = rgbaToString(r, g, b, a);
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "font-family",
    bindingKey: "fontFamily",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const fontVariable = variables.find(v => v.property === 'fontFamily');
      if (fontVariable) {
        return {
          value: fontVariable.value,
          rawValue: fontVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && node.fontName && typeof node.fontName === 'object') {
        const value = node.fontName.family;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "font-size",
    bindingKey: "fontSize",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const sizeVariable = variables.find(v => v.property === 'fontSize');
      if (sizeVariable) {
        return {
          value: sizeVariable.value,
          rawValue: sizeVariable.rawValue
        };
      }

      if (node?.type === "TEXT") {
        const value = `${String(node.fontSize)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "font-weight",
    bindingKey: "fontWeight",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (!node || !hasFont(node)) return null;

      if (node.fontWeight) {
        return {
          value: String(node.fontWeight),
          rawValue: String(node.fontWeight)
        };
      }

      const weightVariable = variables.find(v => v.property === 'fontWeight');
      if (weightVariable) {
        return {
          value: weightVariable.value,
          rawValue: weightVariable.rawValue
        };
      }

      if (node.fontName && typeof node.fontName === 'object') {
        const weightMap: Record<string, string> = {
          'Thin': '100',
          'Extra Light': '200',
          'Light': '300',
          'Regular': '400',
          'Medium': '500',
          'Semi Bold': '600',
          'Bold': '700',
          'Extra Bold': '800',
          'Black': '900',
        };

        const style = node.fontName.style;
        const weight = weightMap[style] || '400';

        return {
          value: weight,
          rawValue: weight
        };
      }

      return null;
    }
  },
  {
    property: "line-height",
    bindingKey: "lineHeight",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const heightVariable = variables.find(v => v.property === 'lineHeight');
      if (heightVariable) {
        return {
          value: heightVariable.value,
          rawValue: heightVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && 'lineHeight' in node) {
        const lineHeight = node.lineHeight;
        if (typeof lineHeight === 'object') {
          if (lineHeight.unit === "AUTO") {
            return { value: "normal", rawValue: "normal" };
          }
          const value = lineHeight.unit.toLowerCase() === "percent" ?
            `${lineHeight.value}%` :
            (lineHeight.value > 4 ? `${lineHeight.value}px` : String(lineHeight.value));
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "letter-spacing",
    bindingKey: "letterSpacing",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const spacingVariable = variables.find(v => v.property === 'letterSpacing');
      if (spacingVariable) {
        return {
          value: spacingVariable.value,
          rawValue: spacingVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && 'letterSpacing' in node) {
        const letterSpacing = node.letterSpacing;
        if (typeof letterSpacing === 'object' && letterSpacing.value !== 0) {
          const value = `${letterSpacing.value}${letterSpacing.unit.toLowerCase() === "percent" ? '%' : 'px'}`;
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "display",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node?.type === "TEXT" && 'textAlignVertical' in node) {
        return { value: "flex", rawValue: "flex" };
      }
      return null;
    }
  },
  {
    property: "flex-direction",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node?.type === "TEXT" && 'textAlignVertical' in node) {
        return { value: "column", rawValue: "column" };
      }
      return null;
    }
  },
  {
    property: "justify-content",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node?.type === "TEXT" && 'textAlignVertical' in node) {
        const alignMap = {
          TOP: "flex-start",
          CENTER: "center",
          BOTTOM: "flex-end"
        };
        const value = alignMap[node.textAlignVertical];
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "width",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node?.type === "TEXT" && 'width' in node) {
        return { value: `${node.width}px`, rawValue: `${node.width}px` };
      }
      return null;
    }
  },
  {
    property: "height",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node?.type === "TEXT" && 'height' in node) {
        return { value: `${node.height}px`, rawValue: `${node.height}px` };
      }
      return null;
    }
  },
]; 