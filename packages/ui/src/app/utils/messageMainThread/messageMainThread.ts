import { MessageToMainThreadPayload } from '@eggstractor/common';

export const messageMainThread = (
  pluginMessage: MessageToMainThreadPayload,
) => {
  window.parent.postMessage({ pluginMessage }, '*');
};
