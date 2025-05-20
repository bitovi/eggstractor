declare namespace NodeJS {
  interface Global {
    figma: {
      currentPage: BaseNode;
      variables: {
        getVariableByIdAsync: (id: string) => Promise<Variable | null>;
      };
    };
  }
}

// For TypeScript 3.4+
declare var global: NodeJS.Global;
