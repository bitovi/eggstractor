import type { OutputMode } from './output-mode';

export type GitProvider = 'github' | 'gitlab';

/**
 * Configuration for Git provider integration (GitHub or GitLab).
 * Supports both cloud-hosted (github.com, gitlab.com) and self-hosted instances.
 */
export interface GitProviderConfig {
  provider?: GitProvider; // Optional for backward compatibility, defaults to 'github'
  repoPath: string;
  filePath: string;
  format: string;
  githubToken?: string | null; // Keep for backward compatibility
  token?: string | null; // New generic token field
  branchName?: string | null;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
  instanceUrl?: string | null; // For self-hosted GitLab (e.g., 'gitlab.company.com')
}

/**
 * @deprecated Use GitProviderConfig instead
 */
export type GithubConfig = GitProviderConfig;
