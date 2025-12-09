/**
 * TODO: Warning, this type is a little shaky and likely to change.
 */
export interface GithubConfig {
  repoPath: string;
  filePath: string;
  format: string;
  githubToken?: string | null;
  branchName?: string | null;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
}
