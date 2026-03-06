import type { StylesheetFormat, OutputMode } from '@eggstractor/common';

export interface ProviderConfig {
  repoPath: string;
  filePath: string;
  authToken: string;
  /** The base/target branch the PR or MR will merge into. Leave empty to target the repo's default branch. */
  targetBranch: string;
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  repoPath: '',
  filePath: '',
  authToken: '',
  targetBranch: '',
  format: 'scss',
  useCombinatorialParsing: true,
  generateSemanticColorUtilities: false,
  outputMode: 'all',
};
