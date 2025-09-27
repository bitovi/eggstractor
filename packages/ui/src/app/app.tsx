import { MemoryRouter, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { Route, Routes, Link } from 'react-router-dom';
import './app.scss';
import { messageMainThread } from './utils';
import { Form } from './Form';
import { GeneratedStylesProvider, Config, ConfigProvider } from './context';
import { useOnPluginMessage } from './hooks';
import { StatusProvider } from './Form/components';

declare global {
  interface Window {
    __DEV__?: boolean; // injected by vite define
    __INITIAL_ROUTE__?: string; // injected by code.ts in Figma; undefined on web
  }
}

export function isFigmaPluginUI(): boolean {
  // Figma UI runs in an iframe
  return window.parent && window.parent !== window;
}

/**
 * useRoutePersistence
 * - Returns a *synchronous* initialRoute string
 * - Also returns a small component that, when rendered inside a Router,
 *   uses useEffect + useLocation to keep the route persisted.
 */
export function useRoutePersistence() {
  // Compute the initial route synchronously once
  const initialRoute = useMemo<string>(() => {
    if (isFigmaPluginUI()) {
      // From code.ts injection
      return window.__INITIAL_ROUTE__ || '/';
    } else {
      // Browser build: sync read from localStorage
      const v = window.localStorage.getItem('memoryRouterPath');
      return v || '/';
    }
  }, []);

  return initialRoute;
}

// Inner component that persists on route changes (render this inside your Router)
function RoutePersistence() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (isFigmaPluginUI()) {
      console.log('persisting route', path);
      window.parent.postMessage(
        { pluginMessage: { type: 'set-route', path } },
        '*'
      );
    } else {
      console.log('not figma plugin', path);
      window.localStorage.setItem('memoryRouterPath', path);
    }
  }, [location.pathname]);

  return null;
}

export const App = () => {
  const initialRoute = useRoutePersistence();
  const [loadedConfig, setLoadedConfig] = useState<Config | null>(null);

  useEffect(() => {
    // Load saved config when UI opens
    messageMainThread({ type: 'load-config' });
  }, []);

  useOnPluginMessage('config-loaded', (msg) => {
    setLoadedConfig({
      branchName: msg.config.branchName ?? '',
      filePath: msg.config.filePath ?? '',
      githubToken: msg.config.githubToken ?? '',
      repoPath: msg.config.repoPath ?? '',
      format: getValidStylesheetFormat(msg.config.outputFormat),
      useCombinatorialParsing: msg.config.useCombinatorialParsing ?? true,
    });
  });

  if (!loadedConfig) {
    return <div>Loading...</div>;
  }

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <RoutePersistence />
      <GeneratedStylesProvider>
        <StatusProvider>
          <ConfigProvider {...loadedConfig}>
            <Form />
          </ConfigProvider>
        </StatusProvider>
      </GeneratedStylesProvider>
      {/* <div>
        <div role="navigation">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/page-2">Page 2</Link>
            </li>
          </ul>
        </div>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                This is the generated root route.{' '}
                <Link to="/page-2">Click here for page 2.</Link>
              </div>
            }
          />
          <Route
            path="/page-2"
            element={
              <div>
                <Link to="/">Click here to go back to root page.</Link>
              </div>
            }
          />
        </Routes>
        test
      </div> */}
    </MemoryRouter>
  );
};

export default App;
