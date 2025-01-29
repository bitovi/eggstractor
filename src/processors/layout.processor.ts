import { StyleProcessor, ProcessedValue, VariableToken } from '../types';

export const layoutProcessors: StyleProcessor[] = [
  {
    property: "display",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode !== "NONE") {
        const value = node.layoutAlign !== "STRETCH" ? "inline-flex" : "flex";
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "flex-direction",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode !== "NONE") {
        const value = node.layoutMode === "VERTICAL" ? "column" : "row";
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "justify-content",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode !== "NONE" && 
          'primaryAxisAlignItems' in node && node.primaryAxisAlignItems !== "MIN") {
        const alignMap = {
          CENTER: "center",
          MAX: "flex-end",
          SPACE_BETWEEN: "space-between"
        };
        const value = alignMap[node.primaryAxisAlignItems] || "flex-start";
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "align-items",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode !== "NONE" && 
          'counterAxisAlignItems' in node) {
        const alignMap = {
          MIN: "flex-start",
          CENTER: "center",
          MAX: "flex-end",
          BASELINE: "baseline"
        };
        const value = alignMap[node.counterAxisAlignItems];
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "gap",
    bindingKey: "itemSpacing",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const gapVariable = variables.find(v => v.property === 'gap');
      if (gapVariable) {
        return {
          value: gapVariable.value,
          rawValue: gapVariable.rawValue
        };
      }

      if (node && 'itemSpacing' in node && node.itemSpacing > 0) {
        const value = `${node.itemSpacing}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
]; 