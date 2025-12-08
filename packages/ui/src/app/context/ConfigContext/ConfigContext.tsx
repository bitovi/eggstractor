import { StylesheetFormat, OutputMode } from '@eggstractor/common';
import { createContext, useContext, useMemo, useState, FC, ReactNode } from 'react';
import { messageMainThread } from '../../utils';

export interface Config {
  repoPath: string;
  filePath: string;
  branchName: string;
  githubToken: string;
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
  repoPath?: string;
  filePath?: string;
  branchName?: string;
  githubToken?: string;
  format?: StylesheetFormat;
  useCombinatorialParsing?: boolean;
  generateSemanticColorUtilities?: boolean;
  outputMode?: OutputMode;
}

export const ConfigProvider: FC<ConfigProps> = ({
  children,
  repoPath: pRepoPath = '',
  filePath: pFilePath = '',
  branchName: pBranchName = '',
  githubToken: pGithubToken = '',
  format: pFormat = 'scss',
  useCombinatorialParsing: pUseComb = true,
  generateSemanticColorUtilities: pGenSemColorUtil = false,
  outputMode: pOutputMode = 'all',
}) => {
  // Internal defaults used only when the prop is undefined at mount
  const [repoPath, setRepoPath] = useState<string>(pRepoPath ?? '');
  const [filePath, setFilePath] = useState<string>(pFilePath ?? '');
  const [branchName, setBranchName] = useState<string>(pBranchName ?? '');
  const [githubToken, setGithubToken] = useState<string>(pGithubToken ?? '');
  const [format, setFormat] = useState<StylesheetFormat>(pFormat ?? 'scss');
  const [useCombinatorialParsing, setUseCombinatorialParsing] = useState<boolean>(pUseComb ?? true);
  const [generateSemanticColorUtilities, setGenerateSemanticColorUtilities] = useState<boolean>(
    pGenSemColorUtil ?? false,
  );
  const [outputMode, setOutputMode] = useState<OutputMode>(pOutputMode ?? 'all');

  const value = useMemo(() => {
    const saveConfig = (config: Partial<Config>): void => {
      const _reportPath = config.repoPath ?? repoPath;
      const _filePath = config.filePath ?? filePath;
      const _branchName = config.branchName ?? branchName;
      const _githubToken = config.githubToken ?? githubToken;
      const _format = config.format ?? format;
      const _useCombinatorialParsing = config.useCombinatorialParsing ?? useCombinatorialParsing;
      const _generateSemanticColorUtilities =
        config.generateSemanticColorUtilities ?? generateSemanticColorUtilities;
      const _outputMode = config.outputMode ?? outputMode;

      setRepoPath(config.repoPath ?? _reportPath);
      setFilePath(config.filePath ?? _filePath);
      setBranchName(config.branchName ?? _branchName);
      setGithubToken(config.githubToken ?? _githubToken);
      setFormat(config.format ?? _format);
      setUseCombinatorialParsing(config.useCombinatorialParsing ?? _useCombinatorialParsing);
      setGenerateSemanticColorUtilities(
        config.generateSemanticColorUtilities ?? _generateSemanticColorUtilities,
      );
      setOutputMode(config.outputMode ?? _outputMode);
      messageMainThread({
        type: 'save-config',
        repoPath: _reportPath,
        filePath: _filePath,
        branchName: _branchName,
        githubToken: _githubToken,
        format: _format,
        useCombinatorialParsing: _useCombinatorialParsing,
        generateSemanticColorUtilities: _generateSemanticColorUtilities,
        outputMode: _outputMode,
      });
    };

    return {
      repoPath,
      filePath,
      branchName,
      githubToken,
      format,
      useCombinatorialParsing,
      generateSemanticColorUtilities,
      outputMode,
      saveConfig,
    };
  }, [
    repoPath,
    filePath,
    branchName,
    githubToken,
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
