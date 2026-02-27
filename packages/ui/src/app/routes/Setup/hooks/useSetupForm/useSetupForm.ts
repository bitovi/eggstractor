import { useState, FormEvent, useMemo } from 'react';
import type { GitProvider } from '@eggstractor/common';
import { useConfig } from '../../../../context';
import type { UseSetupFormReturn } from './types';
import { DEFAULT_PROVIDER_CONFIG, type ProviderConfig } from './config/providerConfig';
import { getProviderLabels } from './config/providerLabels';

export function useSetupForm(): UseSetupFormReturn {
  const {
    provider: initialProvider,
    repoPath: initialRepoPath,
    filePath: initialFilePath,
    authToken: initialAuthToken,
    instanceUrl: initialInstanceUrl,
    format: initialFormat,
    useCombinatorialParsing: initialUseCombinatorialParsing,
    generateSemanticColorUtilities: initialGenerateSemanticColorUtilities,
    outputMode: initialOutputMode,
    saveConfig,
  } = useConfig();

  const [provider, setProvider] = useState<GitProvider>(initialProvider);

  const [githubConfig, setGithubConfig] = useState<ProviderConfig>(
    initialProvider === 'github'
      ? {
          repoPath: initialRepoPath,
          filePath: initialFilePath,
          authToken: initialAuthToken,
          format: initialFormat,
          useCombinatorialParsing: initialUseCombinatorialParsing,
          generateSemanticColorUtilities: initialGenerateSemanticColorUtilities,
          outputMode: initialOutputMode,
        }
      : DEFAULT_PROVIDER_CONFIG,
  );

  const [gitlabConfig, setGitlabConfig] = useState<ProviderConfig>(
    initialProvider === 'gitlab'
      ? {
          repoPath: initialRepoPath,
          filePath: initialFilePath,
          authToken: initialAuthToken,
          format: initialFormat,
          useCombinatorialParsing: initialUseCombinatorialParsing,
          generateSemanticColorUtilities: initialGenerateSemanticColorUtilities,
          outputMode: initialOutputMode,
        }
      : DEFAULT_PROVIDER_CONFIG,
  );

  const [instanceUrl, setInstanceUrl] = useState(initialInstanceUrl || '');

  const currentConfig = provider === 'github' ? githubConfig : gitlabConfig;
  const setCurrentConfig = provider === 'github' ? setGithubConfig : setGitlabConfig;

  const createFieldSetter = <K extends keyof ProviderConfig>(field: K) => {
    return (value: ProviderConfig[K]) => {
      setCurrentConfig((prev) => ({ ...prev, [field]: value }));
    };
  };

  const labels = useMemo(() => getProviderLabels(provider), [provider]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveConfig({
      provider,
      repoPath: currentConfig.repoPath,
      filePath: currentConfig.filePath,
      authToken: currentConfig.authToken,
      instanceUrl: provider === 'gitlab' ? instanceUrl : undefined,
      format: currentConfig.format,
      useCombinatorialParsing: currentConfig.useCombinatorialParsing,
      generateSemanticColorUtilities: currentConfig.generateSemanticColorUtilities,
      outputMode: currentConfig.outputMode,
    });
    alert('Changes saved!');
  };

  return {
    // Form values
    provider,
    repoPath: currentConfig.repoPath,
    filePath: currentConfig.filePath,
    authToken: currentConfig.authToken,
    instanceUrl,
    format: currentConfig.format,
    useCombinatorialParsing: currentConfig.useCombinatorialParsing,
    generateSemanticColorUtilities: currentConfig.generateSemanticColorUtilities,
    outputMode: currentConfig.outputMode,
    // Form handlers
    setProvider,
    setRepoPath: createFieldSetter('repoPath'),
    setFilePath: createFieldSetter('filePath'),
    setAuthToken: createFieldSetter('authToken'),
    setInstanceUrl,
    setFormat: createFieldSetter('format'),
    setUseCombinatorialParsing: createFieldSetter('useCombinatorialParsing'),
    setGenerateSemanticColorUtilities: createFieldSetter('generateSemanticColorUtilities'),
    setOutputMode: createFieldSetter('outputMode'),
    handleSubmit,
    // Provider labels
    ...labels,
  };
}
