import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';
import { isFigmaPluginUI } from './app/utils';

// Register the SCSS language
hljs.registerLanguage('scss', scss);

// dynamic import mock figma server in dev mode
if (!isFigmaPluginUI()) {
  import('./mockFigma').then(({ mockFigma }) => mockFigma());
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
