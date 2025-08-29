export interface NamingContextConfig {
  env: 'css' | 'scss ' | 'tailwind-v4' | 'tailwind-v3-sass';
  includePageInPath?: boolean;
  delimiters: {
    pathSeparator: string;
    afterComponentName: string;
    variantEqualSign: string;
    betweenVariants: string;
  };
  duplicate?: (name: string, count: number) => string;
}

 type DeepRequired<T> = T extends object ? {
        [P in keyof T]-?: DeepRequired<T[P]>;
    } : T;

export type DefaultNamingContextConfig = DeepRequired<NamingContextConfig>;

export const defaultContextConfig = {
  env: 'css',
  includePageInPath: true,
  delimiters: {
    pathSeparator: '-',
    afterComponentName: '-',
    variantEqualSign: '_',
    betweenVariants: '-',
  },
  duplicate: (name: string, count: number) => `${name}${count}`,
} as const satisfies DefaultNamingContextConfig;

export const tailwind4NamingConfig = {
  env: 'tailwind-v4',
  delimiters: {
    pathSeparator: '/',
    afterComponentName: '.',
    variantEqualSign: '_',
    betweenVariants: '.',
  }
} as const satisfies NamingContextConfig;
