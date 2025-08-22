export interface NamingContext {
  env: 'css' | 'scss ' | 'tailwind-v4' | 'tailwind-v3-sass';
  prefix?: string;
  includePageInPath?: boolean;
  delimiters: {
    pathSeparator: string;
    afterComponentName: string;
    variantEqualSign: string;
    betweenVariants: string;
  };
  duplicate?: (name: string, count: number) => string;
}

export const defaultContext: NamingContext = {
  env: 'css',
  includePageInPath: true,
  delimiters: {
    pathSeparator: '-',
    afterComponentName: '-',
    variantEqualSign: '_',
    betweenVariants: '-',
  },
  duplicate: (name, count) => `${name}${count}`,
};

export const tailwind4NamingConvention: NamingContext = {
  env: 'tailwind-v4',
  delimiters: {
    pathSeparator: '/',
    afterComponentName: '.',
    variantEqualSign: '_',
    betweenVariants: '.',
  },
  duplicate: (name, count) => `${name}${count}`,
};
