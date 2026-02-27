import type { StylesheetFormat, OutputMode } from '@eggstractor/common';

export interface ProviderConfig {
  repoPath: string;
  filePath: string;
  authToken: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  repoPath: '',
  filePath: '',
  authToken: '',
  format: 'scss',
  useCombinatorialParsing: true,
  generateSemanticColorUtilities: false,
  outputMode: 'all',
};
