import { StyleProcessor, ProcessedValue } from '../types';

interface NodeWithPadding {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

function hasNodePadding(node: SceneNode): node is SceneNode & NodeWithPadding {
  return 'paddingTop' in node && 'paddingRight' in node && 'paddingBottom' in node && 'paddingLeft' in node;
}

const getVarName = async (key: string, boundVars: Record<string, { type: string, id: string }>) => {
  const varAlias = boundVars[key];
  if (varAlias?.type === 'VARIABLE_ALIAS') {
    const variable = await figma.variables.getVariableByIdAsync(varAlias.id);
    return `$${variable?.name}`;
  }
  return null;
};

export const spacingProcessors: StyleProcessor[] = [
  {
    property: "padding",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && hasNodePadding(node)) {
        const topVal = `${node.paddingTop}px`;
        const rightVal = `${node.paddingRight}px`;
        const bottomVal = `${node.paddingBottom}px`;
        const leftVal = `${node.paddingLeft}px`;
        let topVar, rightVar, bottomVar, leftVar;

        if ('boundVariables' in node && node.boundVariables) {
          const boundVars = node.boundVariables as Record<string, { type: string, id: string }>;
          topVar = await getVarName('paddingTop', boundVars);
          rightVar = await getVarName('paddingRight', boundVars);
          bottomVar = await getVarName('paddingBottom', boundVars);
          leftVar = await getVarName('paddingLeft', boundVars);
        }

        if (topVal === rightVal && rightVal === bottomVal && bottomVal === leftVal) {
          return { value: topVar || topVal, rawValue: topVal };
        }
        if (topVal === bottomVal && leftVal === rightVal) {
          const value = `${topVar || topVal} ${leftVar || leftVal}`;
          const rawValue = `${topVal} ${leftVal}`;
          return { value, rawValue };
        }
        const value = `${topVar || topVal} ${rightVar || rightVal} ${bottomVar || bottomVal} ${leftVar || leftVal}`;
        const rawValue = `${topVal} ${rightVal} ${bottomVal} ${leftVal}`;
          return { value, rawValue };
      }
      return null;
    }
  }
]; 