import { StyleProcessor, ProcessedValue } from '../types';
import { rgbaToString } from '../utils/index';

export const borderProcessors: StyleProcessor[] = [
  {
    property: "border-color",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const borderVariable = variables.find(v => v.property === 'strokes');
      if (borderVariable) {
        return {
          value: borderVariable.value,
          rawValue: borderVariable.rawValue
        };
      }

      if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0] as Paint;
        if (stroke?.type === "SOLID") {
          const { r, g, b } = stroke.color;
          const a = stroke.opacity ?? 1;
          const value = rgbaToString(r, g, b, a);
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "border-width",
    bindingKey: "strokeWeight",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const widthVariable = variables.find(v => v.property === 'strokeWeight');
      if (widthVariable) {
        return {
          value: widthVariable.value,
          rawValue: widthVariable.rawValue
        };
      }

      if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        if ('strokeWeight' in node && node.strokeWeight) {
          const value = `${String(node.strokeWeight)}px`;
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "border-radius",
    bindingKey: "cornerRadius",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const radiusVariable = variables.find(v => v.property === 'border-radius');
      if (radiusVariable) {
        return {
          value: radiusVariable.value,
          rawValue: radiusVariable.rawValue
        };
      }

      if (node && 'cornerRadius' in node && node.cornerRadius) {
        const value = `${String(node.cornerRadius)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
]; 