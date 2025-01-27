import { StyleProcessor, VariableToken, ProcessedValue } from '../types';
import { rgbaToString } from '../utils/color.utils';

export const fontProcessors: StyleProcessor[] = [
  {
    property: "color",
    bindingKey: "fills",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const colorVariable = variables.find(v => v.property === 'color');
      if (colorVariable) {
        return {
          value: colorVariable.value,
          rawValue: colorVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && node.fills && Array.isArray(node.fills)) {
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
      const fontVariable = variables.find(v => v.property === 'font-family');
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
      const sizeVariable = variables.find(v => v.property === 'font-size');
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
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const weightVariable = variables.find(v => v.property === 'font-weight');
      if (weightVariable) {
        return {
          value: weightVariable.value,
          rawValue: weightVariable.rawValue
        };
      }

      if (node?.type === "TEXT") {
        const value = String(node.fontWeight);
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "line-height",
    bindingKey: "lineHeight",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const heightVariable = variables.find(v => v.property === 'line-height');
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
      const spacingVariable = variables.find(v => v.property === 'letter-spacing');
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
  }
]; 