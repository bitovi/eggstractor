declare global {
  const __DEV__: boolean; // injected by vite define
  interface Window {
    // injected by code.ts in Figma; null on web
    __INITIAL_ROUTE__?: string | null;
  }
}

export {};
