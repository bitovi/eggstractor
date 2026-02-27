import type { OutputMode } from './output-mode';

export type GitProvider = 'github' | 'gitlab';

/**
 * TODO: Warning, this type is a little shaky and likely to change.
 */
export interface GitProviderConfig {
  provider?: GitProvider;
  repoPath: string;
  filePath: string;
  format: string;
  authToken?: string | null;
  branchName?: string | null;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
  instanceUrl?: string | null; // For self-hosted GitLab (e.g., 'gitlab.company.com')
}
