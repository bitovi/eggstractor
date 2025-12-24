import { StylesheetFormat, OutputMode, GitProvider } from '@eggstractor/common';
import { createContext, useContext, useMemo, useState, FC, ReactNode } from 'react';
import { messageMainThread } from '../../utils';

export interface Config {
  provider: GitProvider;
  repoPath: string;
  filePath: string;
  branchName: string;
  authToken: string;
  instanceUrl?: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}

type ConfigType = Config & {
  saveConfig: (config: Partial<Config>) => void;
};

const ConfigContext = createContext<ConfigType | undefined>(undefined);

interface ConfigProps {
  children: ReactNode;
  /** Optional controlled props — when provided they seed initial state and sync on change */
  provider?: GitProvider;
  repoPath?: string;
  filePath?: string;
  branchName?: string;
  authToken?: string;
  instanceUrl?: string;
  format?: StylesheetFormat;
  useCombinatorialParsing?: boolean;
  generateSemanticColorUtilities?: boolean;
  outputMode?: OutputMode;
}

export const ConfigProvider: FC<ConfigProps> = ({
  children,
  provider: pProvider = 'github',
  repoPath: pRepoPath = '',
  filePath: pFilePath = '',
  branchName: pBranchName = '',
  authToken: pAuthToken = '',
  instanceUrl: pInstanceUrl = '',
  format: pFormat = 'scss',
  useCombinatorialParsing: pUseComb = true,
  generateSemanticColorUtilities: pGenSemColorUtil = false,
  outputMode: pOutputMode = 'all',
}) => {
  // Internal defaults used only when the prop is undefined at mount
  const [provider, setProvider] = useState<GitProvider>(pProvider ?? 'github');
  const [repoPath, setRepoPath] = useState<string>(pRepoPath ?? '');
  const [filePath, setFilePath] = useState<string>(pFilePath ?? '');
  const [branchName, setBranchName] = useState<string>(pBranchName ?? '');
  const [authToken, setAuthToken] = useState<string>(pAuthToken ?? '');
  const [instanceUrl, setInstanceUrl] = useState<string>(pInstanceUrl ?? '');
  const [format, setFormat] = useState<StylesheetFormat>(pFormat ?? 'scss');
  const [useCombinatorialParsing, setUseCombinatorialParsing] = useState<boolean>(pUseComb ?? true);
  const [generateSemanticColorUtilities, setGenerateSemanticColorUtilities] = useState<boolean>(
    pGenSemColorUtil ?? false,
  );
  const [outputMode, setOutputMode] = useState<OutputMode>(pOutputMode ?? 'all');

  const value = useMemo(() => {
    const saveConfig = (config: Partial<Config>): void => {
      const _provider = config.provider ?? provider;
      const _reportPath = config.repoPath ?? repoPath;
      const _filePath = config.filePath ?? filePath;
      const _branchName = config.branchName ?? branchName;
      const _authToken = config.authToken ?? authToken;
      const _instanceUrl = config.instanceUrl ?? instanceUrl;
      const _format = config.format ?? format;
      const _useCombinatorialParsing = config.useCombinatorialParsing ?? useCombinatorialParsing;
      const _generateSemanticColorUtilities =
        config.generateSemanticColorUtilities ?? generateSemanticColorUtilities;
      const _outputMode = config.outputMode ?? outputMode;

      setProvider(config.provider ?? _provider);
      setRepoPath(config.repoPath ?? _reportPath);
      setFilePath(config.filePath ?? _filePath);
      setBranchName(config.branchName ?? _branchName);
      setAuthToken(config.authToken ?? _authToken);
      setInstanceUrl(config.instanceUrl ?? _instanceUrl);
      setFormat(config.format ?? _format);
      setUseCombinatorialParsing(config.useCombinatorialParsing ?? _useCombinatorialParsing);
      setGenerateSemanticColorUtilities(
        config.generateSemanticColorUtilities ?? _generateSemanticColorUtilities,
      );
      setOutputMode(config.outputMode ?? _outputMode);
      messageMainThread({
        type: 'save-config',
        provider: _provider,
        repoPath: _reportPath,
        filePath: _filePath,
        branchName: _branchName,
        authToken: _authToken,
        instanceUrl: _instanceUrl,
        format: _format,
        useCombinatorialParsing: _useCombinatorialParsing,
        generateSemanticColorUtilities: _generateSemanticColorUtilities,
        outputMode: _outputMode,
      });
    };

    return {
      provider,
      repoPath,
      filePath,
      branchName,
      authToken,
      instanceUrl,
      format,
      useCombinatorialParsing,
      generateSemanticColorUtilities,
      outputMode,
      saveConfig,
    };
  }, [
    provider,
    repoPath,
    filePath,
    branchName,
    authToken,
    instanceUrl,
    format,
    useCombinatorialParsing,
    generateSemanticColorUtilities,
    outputMode,
  ]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};
