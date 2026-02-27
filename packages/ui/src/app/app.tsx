import { useEffect, useState } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { Route, Routes } from 'react-router-dom';
import { messageMainThread } from './utils';
import { Export, Setup, About, Components, StatusProvider } from './routes';
import { GeneratedStylesProvider, Config, ConfigProvider } from './context';
import { useOnPluginMessage, useRoutePersistence } from './hooks';
import { MemoryPersistenceRouter, Nav } from './components';
import '../styles.scss';

export const App = () => {
  const initialRoute = useRoutePersistence();
  const [loadedConfig, setLoadedConfig] = useState<Config | null>(null);

  useOnPluginMessage('config-loaded', (msg) => {
    setLoadedConfig({
      provider: msg.config.provider ?? 'github',
      branchName: msg.config.branchName ?? '',
      filePath: msg.config.filePath ?? '',
      authToken: msg.config.authToken ?? '',
      repoPath: msg.config.repoPath ?? '',
      instanceUrl: msg.config.instanceUrl ?? undefined,
      format: getValidStylesheetFormat(msg.config.format),
      useCombinatorialParsing: msg.config.useCombinatorialParsing ?? true,
      generateSemanticColorUtilities: msg.config.generateSemanticColorUtilities ?? false,
      outputMode: msg.config.outputMode ?? 'all',
    });
  });

  useEffect(() => {
    console.info('loading config');
    // Load saved config when UI opens
    messageMainThread({ type: 'load-config' });
  }, []);

  if (!loadedConfig) {
    return null;
  }

  return (
    <MemoryPersistenceRouter initialRoute={initialRoute}>
      <GeneratedStylesProvider>
        <StatusProvider>
          <ConfigProvider {...loadedConfig}>
            <Nav />
            <Routes>
              <Route path="/" element={<Export />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/about" element={<About />} />
              <Route path="components" element={<Components />} />
            </Routes>
          </ConfigProvider>
        </StatusProvider>
      </GeneratedStylesProvider>
    </MemoryPersistenceRouter>
  );
};

export default App;
