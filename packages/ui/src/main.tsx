import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';
import type { MessageToUIPayload } from '@eggstractor/common';

const eventHasMessageToUIPayload = (
  event: MessageEvent
): event is MessageEvent<{ pluginMessage: MessageToUIPayload }> => {
  return (
    typeof event === 'object' &&
    event !== null &&
    'data' in event &&
    typeof event.data === 'object' &&
    event.data !== null &&
    'pluginMessage' in event.data &&
    typeof event.data.pluginMessage === 'object' &&
    event.data.pluginMessage !== null &&
    'type' in event.data.pluginMessage &&
    typeof event.data.pluginMessage.type === 'string'
  );
};

// Update the message handler
window.onmessage = async (event) => {
  if (!eventHasMessageToUIPayload(event)) return;
  console.log(event.data.pluginMessage);
};

// Register the SCSS language
hljs.registerLanguage('scss', scss);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
