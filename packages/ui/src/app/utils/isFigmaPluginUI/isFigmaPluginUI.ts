export const isFigmaPluginUI = (): boolean => {
  // Figma UI runs in an iframe
  return window.parent && window.parent !== window;
};
