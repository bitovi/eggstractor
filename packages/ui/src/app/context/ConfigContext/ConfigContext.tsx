import { StylesheetFormat } from '@eggstractor/common';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  FC,
  ReactNode,
} from 'react';
import { messageMainThread } from '../../utilities';

export interface Config {
  repoPath: string;
  filePath: string;
  branchName: string;
  githubToken: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
}

type ConfigType = Config & {
  setRepoPath: Dispatch<React.SetStateAction<string>>;
  setFilePath: Dispatch<React.SetStateAction<string>>;
  setBranchName: Dispatch<React.SetStateAction<string>>;
  setGithubToken: Dispatch<React.SetStateAction<string>>;
  setFormat: Dispatch<React.SetStateAction<StylesheetFormat>>;
  setUseCombinatorialParsing: Dispatch<React.SetStateAction<boolean>>;
}

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
}

export const ConfigProvider: FC<ConfigProps> = ({
  children,
  repoPath: pRepoPath = '',
  filePath: pFilePath = '',
  branchName: pBranchName = '',
  githubToken: pGithubToken = '',
  format: pFormat = 'scss',
  useCombinatorialParsing: pUseComb = true,
}) => {
  // Internal defaults used only when the prop is undefined at mount
  const [repoPath, setRepoPath] = useState<string>(pRepoPath ?? '');
  const [filePath, setFilePath] = useState<string>(pFilePath ?? '');
  const [branchName, setBranchName] = useState<string>(pBranchName ?? '');
  const [githubToken, setGithubToken] = useState<string>(pGithubToken ?? '');
  const [format, setFormat] = useState<StylesheetFormat>(pFormat ?? 'scss');
  const [useCombinatorialParsing, setUseCombinatorialParsing] =
    useState<boolean>(pUseComb ?? true);

  const value = useMemo(
    () => ({
      repoPath,
      setRepoPath,
      filePath,
      setFilePath,
      branchName,
      setBranchName,
      githubToken,
      setGithubToken,
      format,
      setFormat,
      useCombinatorialParsing,
      setUseCombinatorialParsing,
    }),
    [
      repoPath,
      filePath,
      branchName,
      githubToken,
      format,
      useCombinatorialParsing,
    ]
  );

  useEffect(() => {
    messageMainThread({
      type: 'save-config',
      repoPath,
      filePath,
      branchName,
      githubToken,
      format,
      useCombinatorialParsing,
    });
  }, [
    repoPath,
    filePath,
    branchName,
    githubToken,
    format,
    useCombinatorialParsing,
  ]);

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
};
