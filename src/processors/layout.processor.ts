import { StyleProcessor, VariableToken, ProcessedValue } from '../types';

interface NodeWithLayout {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  layoutAlign?: string;
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  counterAxisSizingMode?: "FIXED" | "AUTO";
  absoluteBoundingBox?: { width: number; height: number };
  textAutoResize?: "NONE" | "WIDTH" | "HEIGHT" | "WIDTH_AND_HEIGHT";
  type?: string;
}

function hasLayout(node: SceneNode): node is SceneNode & NodeWithLayout {
  return 'layoutMode' in node || 'absoluteBoundingBox' in node;
}

export const layoutProcessors: StyleProcessor[] = [
  {
    property: "display",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && ('layoutMode' in node) && node.layoutMode !== "NONE") {
        const value = "flex";
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
          rawValue: gapVariable.rawValue,
          valueType: gapVariable.valueType
        };
      }

      if (node && 'itemSpacing' in node && node.itemSpacing > 0) {
        const value = `${node.itemSpacing}px`;
        return { value, rawValue: value, valueType: 'px' };
      }
      return null;
    }
  },
  {
    property: "min-width",
    bindingKey: undefined,
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const minWidthVariable = variables.find(v => v.property === 'minWidth');
      if (minWidthVariable) {
        return {
          value: `${minWidthVariable.value}`,
          rawValue: `${minWidthVariable.rawValue}`,
          valueType: 'px'
        };
      }

      if (node && hasLayout(node) && node.minWidth) {
        return {
          value: `${node.minWidth}px`,
          rawValue: `${node.minWidth}px`,
          valueType: 'px'
        };
      }
      return null;
    }
  },
  {
    property: "max-width",
    bindingKey: undefined,
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const maxWidthVariable = variables.find(v => v.property === 'maxWidth');
      if (maxWidthVariable) {
        return {
          value: `${maxWidthVariable.value}`,
          rawValue: `${maxWidthVariable.rawValue}`,
          valueType: 'px'
        };
      }

      if (node && hasLayout(node) && node.maxWidth) {
        return {
          value: `${node.maxWidth}px`,
          rawValue: `${node.maxWidth}px`,
          valueType: 'px'
        };
      }
      return null;
    }
  },
  {
    property: "min-height",
    bindingKey: undefined,
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const minHeightVariable = variables.find(v => v.property === 'minHeight');
      if (minHeightVariable) {
        return {
          value: `${minHeightVariable.value}`,
          rawValue: `${minHeightVariable.rawValue}`,
          valueType: 'px'
        };
      }

      if (node && hasLayout(node) && node.minHeight) {
        return {
          value: `${node.minHeight}px`,
          rawValue: `${node.minHeight}px`,
          valueType: 'px'
        };
      }
      return null;
    }
  },
  {
    property: "max-height",
    bindingKey: undefined,
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const maxHeightVariable = variables.find(v => v.property === 'maxHeight');
      if (maxHeightVariable) {
        return {
          value: `${maxHeightVariable.value}`,
          rawValue: `${maxHeightVariable.rawValue}`,
          valueType: 'px'
        };
      }

      if (node && hasLayout(node) && node.maxHeight) {
        return {
          value: `${node.maxHeight}px`,
          rawValue: `${node.maxHeight}px`,
          valueType: 'px'
        };
      }
      return null;
    }
  },
  {
    property: "width",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (!node || !hasLayout(node)) return null;

      // Handle text nodes
      if (node.type === "TEXT") {
        if (node.textAutoResize === "NONE" || node.textAutoResize === "HEIGHT") {
          return {
            value: `${node.absoluteBoundingBox?.width}px`,
            rawValue: `${node.absoluteBoundingBox?.width}px`,
            valueType: 'px'
          };
        }
        return null;
      }

      // Handle auto layout frames
      if (node.layoutMode) {
        if (node.layoutMode === "HORIZONTAL" && node.primaryAxisSizingMode === "FIXED" ||
            node.layoutMode === "VERTICAL" && node.counterAxisSizingMode === "FIXED") {
          return {
            value: `${node.absoluteBoundingBox?.width}px`,
            rawValue: `${node.absoluteBoundingBox?.width}px`,
            valueType: 'px'
          };
        }
      }

      return null;
    }
  },
  {
    property: "height",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (!node || !hasLayout(node)) return null;

      // Handle text nodes - height is usually determined by content
      if (node.type === "TEXT") {
        if (node.textAutoResize === "NONE" || node.textAutoResize === "WIDTH_AND_HEIGHT") {
          return {
            value: `${node.absoluteBoundingBox?.height}px`,
            rawValue: `${node.absoluteBoundingBox?.height}px`,
            valueType: 'px'
          };
        }
        return null;
      }

      // Handle auto layout frames
      if (node.layoutMode) {
        if (node.layoutMode === "VERTICAL" && node.primaryAxisSizingMode === "FIXED" ||
            node.layoutMode === "HORIZONTAL" && node.counterAxisSizingMode === "FIXED") {
          return {
            value: `${node.absoluteBoundingBox?.height}px`,
            rawValue: `${node.absoluteBoundingBox?.height}px`,
            valueType: 'px'
          };
        }
      }

      return null;
    }
  }
]; 