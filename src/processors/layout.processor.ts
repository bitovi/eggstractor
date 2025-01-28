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
    property: "align-items",
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
  {
    property: "padding",
    bindingKey: undefined,
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const top = variables.find(v => v.property === 'padding-top');
      const right = variables.find(v => v.property === 'padding-right');
      const bottom = variables.find(v => v.property === 'padding-bottom');
      const left = variables.find(v => v.property === 'padding-left');

      if (top || right || bottom || left) {
        const getValue = (v: VariableToken | undefined, fallback: string) => v ? v.value : fallback;
        const getRawValue = (v: VariableToken | undefined, fallback: string) => v ? v.rawValue : fallback;

        return {
          value: `${getValue(top, '0')} ${getValue(right, '0')} ${getValue(bottom, '0')} ${getValue(left, '0')}`,
          rawValue: `${getRawValue(top, '0')} ${getRawValue(right, '0')} ${getRawValue(bottom, '0')} ${getRawValue(left, '0')}`
        };
      }

      if (node && 'paddingTop' in node) {
        const topVal = `${node.paddingTop}px`;
        const rightVal = `${node.paddingRight}px`;
        const bottomVal = `${node.paddingBottom}px`;
        const leftVal = `${node.paddingLeft}px`;

        if (topVal === rightVal && rightVal === bottomVal && bottomVal === leftVal) {
          return { value: topVal, rawValue: topVal };
        }
        if (topVal === bottomVal && leftVal === rightVal) {
          const value = `${topVal} ${leftVal}`;
          return { value, rawValue: value };
        }
        const value = `${topVal} ${rightVal} ${bottomVal} ${leftVal}`;
        return { value, rawValue: value };
      }
      return null;
    }
  }
]; 