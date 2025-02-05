import { StyleProcessor, ProcessedValue } from '../types';
import { rgbaToString } from '../utils/index';

export const borderProcessors: StyleProcessor[] = [
  {
    property: "border",
    bindingKey: "strokes",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      // Check if we are Centre alignment
      if (node && ('strokeAlign' in node && node.strokeAlign !== 'CENTER' || !('strokeAlign' in node))) {
        return null;
      }

      const borderColorVariable = variables.find(v => v.property === 'border');
      const borderLeftVariable = variables.find(v => v.property === "strokeLeftWeight");
      const borderRightVariable = variables.find(v => v.property === "strokeRightWeight");
      const borderTopVariable = variables.find(v => v.property === "strokeTopWeight");
      const borderBottomVariable = variables.find(v => v.property === "strokeBottomWeight");

      if (borderLeftVariable && borderRightVariable && borderTopVariable && borderBottomVariable &&
        !(borderLeftVariable.value === borderRightVariable.value && borderTopVariable.value === borderBottomVariable.value)) {
        return null;
      }

      const width = node && 'strokeWeight' in node ? `${String(node.strokeWeight)}px` : null;
      const type = node && 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

      if (width && borderColorVariable) {
        const value = `${borderLeftVariable?.value || width} ${type} ${borderColorVariable.value}`;
        const rawValue = `${borderLeftVariable?.rawValue || width} ${type} ${borderColorVariable.rawValue}`;

        return {
          value: value,
          rawValue: rawValue,
          valueType: "px"
        };
      }

      if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0] as Paint;

        let color = null;
        if (stroke?.type === "SOLID") {
          const { r, g, b } = stroke.color;
          const a = stroke.opacity ?? 1;
          color = rgbaToString(r, g, b, a);
        }

        if (width && color) {
          const value = `${borderLeftVariable?.value || width} ${type} ${color}`;
          const rawValue = `${borderLeftVariable?.rawValue || width} ${type} ${color}`;
          return { value, rawValue, valueType: "px" };
        }
      }
      return null;
    }
  },
  {
    property: "outline",
    bindingKey: undefined,
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'strokeAlign' in node && node.strokeAlign !== 'OUTSIDE') {
        return null;
      }
      // Get box sizing based on strokeAlign
      const borderVariable = variables.find(v => v.property === 'border');
      const width = node && 'strokeWeight' in node ? `${String(node.strokeWeight)}px` : null;
      const type = node && 'dashPattern' in node && node.dashPattern.length > 0 ? 'dashed' : 'solid';

      if (width && borderVariable) {
        const value = `${width} ${type} ${borderVariable.value}`;
        const rawValue = `${width} ${type} ${borderVariable.rawValue}`;

        return {
          value: value,
          rawValue: rawValue,
          valueType: "px"
        };
      }

      if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0] as Paint;

        let color = null;
        if (stroke?.type === "SOLID") {
          const { r, g, b } = stroke.color;
          const a = stroke.opacity ?? 1;
          color = rgbaToString(r, g, b, a);
        }

        if (width && color) {
          const value = `${width} ${type} ${color}`;
          return { value, rawValue: value, valueType: "px" };
        }
      }
      return null;
    }
  },
  {
    property: "box-shadow",
    bindingKey: undefined,
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'strokeAlign' in node && node.strokeAlign !== 'INSIDE') {
        return null;
      }
      // Get box sizing based on strokeAlign
      const borderVariable = variables.find(v => v.property === 'border');
      console.log({ borderVariable, variables });
      const width = node && 'strokeWeight' in node ? `${String(node.strokeWeight)}px` : null;

      if (width && borderVariable) {
        const value = `inset 0 0 0 ${width} ${borderVariable.value}`;
        const rawValue = `inset 0 0 0 ${width} ${borderVariable.rawValue}`;

        return {
          value: value,
          rawValue: rawValue,
          valueType: "px"
        };
      }

      if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0] as Paint;

        let color = null;
        if (stroke?.type === "SOLID") {
          const { r, g, b } = stroke.color;
          const a = stroke.opacity ?? 1;
          color = rgbaToString(r, g, b, a);
        }

        if (width && color) {
          const value = `inset 0 0 0 ${width} ${color}`;
          return { value, rawValue: value, valueType: "px" };
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