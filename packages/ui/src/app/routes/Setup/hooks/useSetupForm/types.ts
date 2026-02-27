import { FormEvent } from 'react';
import type { StylesheetFormat, OutputMode, GitProvider } from '@eggstractor/common';

export interface SetupFormValues {
  provider: GitProvider;
  repoPath: string;
  filePath: string;
  authToken: string;
  instanceUrl: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}

export interface SetupFormHandlers {
  setProvider: (provider: GitProvider) => void;
  setRepoPath: (repoPath: string) => void;
  setFilePath: (filePath: string) => void;
  setAuthToken: (authToken: string) => void;
  setInstanceUrl: (instanceUrl: string) => void;
  setFormat: (format: StylesheetFormat) => void;
  setUseCombinatorialParsing: (value: boolean) => void;
  setGenerateSemanticColorUtilities: (value: boolean) => void;
  setOutputMode: (outputMode: OutputMode) => void;
  handleSubmit: (e: FormEvent) => void;
}

export interface ProviderLabels {
  providerLabel: string;
  repoLabel: string;
  repoHint: string;
  repoLinkHref: string;
  tokenLabel: string;
  tokenLinkHref: string;
}

export type UseSetupFormReturn = SetupFormValues & SetupFormHandlers & ProviderLabels;
