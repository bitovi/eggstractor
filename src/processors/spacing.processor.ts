import { StyleProcessor, ProcessedValue } from '../types';

export const spacingProcessors: StyleProcessor[] = [
  {
    property: "padding-top",
    bindingKey: "paddingTop",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const paddingVariable = variables.find(v => v.property === 'padding-top');
      if (paddingVariable) {
        return {
          value: paddingVariable.value,
          rawValue: paddingVariable.rawValue
        };
      }

      if (node && 'paddingTop' in node) {
        const value = `${node.paddingTop}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "padding-right",
    bindingKey: "paddingRight",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const paddingVariable = variables.find(v => v.property === 'padding-right');
      if (paddingVariable) {
        return {
          value: paddingVariable.value,
          rawValue: paddingVariable.rawValue
        };
      }

      if (node && 'paddingRight' in node) {
        const value = `${node.paddingRight}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "padding-bottom",
    bindingKey: "paddingBottom",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const paddingVariable = variables.find(v => v.property === 'padding-bottom');
      if (paddingVariable) {
        return {
          value: paddingVariable.value,
          rawValue: paddingVariable.rawValue
        };
      }

      if (node && 'paddingBottom' in node) {
        const value = `${node.paddingBottom}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "padding-left",
    bindingKey: "paddingLeft",
    process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
      const paddingVariable = variables.find(v => v.property === 'padding-left');
      if (paddingVariable) {
        return {
          value: paddingVariable.value,
          rawValue: paddingVariable.rawValue
        };
      }

      if (node && 'paddingLeft' in node) {
        const value = `${node.paddingLeft}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  }
]; 