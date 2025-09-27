import { useEffect, useState } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { Route, Routes, Link } from 'react-router-dom';
import '../styles.scss';
import { messageMainThread } from './utils';
import { About, Form, StatusProvider } from './routes';
import { GeneratedStylesProvider, Config, ConfigProvider } from './context';
import { useOnPluginMessage, useRoutePersistence } from './hooks';
import { MemoryPersistenceRouter } from './components';

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
    // TODO: better loading state
    return <div>Loading...</div>;
  }

  return (
    <MemoryPersistenceRouter initialRoute={initialRoute}>
      <GeneratedStylesProvider>
        <StatusProvider>
          <ConfigProvider {...loadedConfig}>
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
              <Route path="/" element={<Form />} />
              <Route path="/page-2" element={<About />} />
            </Routes>
          </ConfigProvider>
        </StatusProvider>
      </GeneratedStylesProvider>
    </MemoryPersistenceRouter>
  );
};

export default App;
