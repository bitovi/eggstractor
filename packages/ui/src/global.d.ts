declare global {
  const __DEV__: boolean; // injected by vite define
  interface Window {
    __INITIAL_ROUTE__?: string; // injected by code.ts in Figma; undefined on web
  }
}

export {};
