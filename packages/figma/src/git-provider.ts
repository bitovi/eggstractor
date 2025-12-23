import { GitProviderConfig, GitProvider } from '@eggstractor/common';
import { toBase64 } from './utils';

export interface PRResult {
  prUrl: string;
}

// Generate a unique file ID and store it in the file itself
const getFileId = () => {
  let fileId = figma.root.getPluginData('customFileId');
  if (!fileId) {
    fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    figma.root.setPluginData('customFileId', fileId);
  }
  return fileId;
};

// URL-encode a file path for GitLab API
const encodeFilePath = (path: string): string => {
  return encodeURIComponent(path);
};

// Get the base URL for GitLab instance
const getGitLabBaseUrl = (instanceUrl?: string | null): string => {
  const host = instanceUrl && instanceUrl.trim() ? instanceUrl.trim() : 'gitlab.com';
  // Remove protocol if user included it
  const cleanHost = host.replace(/^https?:\/\//, '');
  return `https://${cleanHost}/api/v4`;
};

// URL-encode the project path for GitLab (e.g., "owner/repo" -> "owner%2Frepo")
const encodeProjectPath = (repoPath: string): string => {
  return encodeURIComponent(repoPath);
};

export default {
  saveToken: async function (token: string) {
    const fileId = getFileId();
    const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
    const tokens = JSON.parse(userTokens);

    tokens[fileId] = token;
    await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
  },
  getToken: async function (): Promise<string | null> {
    const fileId = getFileId();
    const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
    const tokens = JSON.parse(userTokens);

    return tokens[fileId] || null;
  },
  saveBranchName: async function (branchName: string) {
    const fileId = getFileId();
    const userBranches = (await figma.clientStorage.getAsync('fileBranches')) || '{}';
    const branches = JSON.parse(userBranches);
    branches[fileId] = branchName;
    await figma.clientStorage.setAsync('fileBranches', JSON.stringify(branches));
  },
  getBranchName: async function (): Promise<string | null> {
    const fileId = getFileId();
    const userBranches = (await figma.clientStorage.getAsync('fileBranches')) || '{}';
    const branches = JSON.parse(userBranches);
    return branches[fileId] || null;
  },
  saveGitProviderConfig: async function saveGitProviderConfig(config: GitProviderConfig) {
    await figma.root.setPluginData('gitProviderConfig', JSON.stringify(config));
  },
  getGitProviderConfig: async function getGitProviderConfig(): Promise<GitProviderConfig | null> {
    try {
      // Try new config first
      const savedConfig = figma.root.getPluginData('gitProviderConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig) as GitProviderConfig;
      }

      // Fall back to old githubConfig for backward compatibility
      const oldConfig = figma.root.getPluginData('githubConfig');
      if (oldConfig) {
        const parsed = JSON.parse(oldConfig) as GitProviderConfig;
        // Add default provider if not present
        if (!parsed.provider) {
          parsed.provider = 'github';
        }
        return parsed;
      }

      return null;
    } catch (error) {
      console.error('Error reading config:', error);
      return null;
    }
  },
  // Main entry point for creating PR/MR
  createPR: async function createPR(
    provider: GitProvider,
    token: string,
    repoPath: string,
    filePath: string,
    branchName: string,
    content: string,
    instanceUrl?: string | null,
  ): Promise<PRResult> {
    if (provider === 'gitlab') {
      return this.createGitLabMR(token, repoPath, filePath, branchName, content, instanceUrl);
    }
    return this.createGitHubPR(token, repoPath, filePath, branchName, content);
  },
  createGitHubPR: async function createGitHubPR(
    token: string,
    repoPath: string,
    filePath: string,
    branchName: string,
    content: string,
  ): Promise<PRResult> {
    const baseUrl = 'https://api.github.com';
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    try {
      // Get default branch
      const repoResponse = await fetch(`${baseUrl}/repos/${repoPath}`, {
        headers,
      });
      if (!repoResponse.ok) {
        throw new Error(`Repository not found: ${repoPath}`);
      }
      const repoData = (await repoResponse.json()) as {
        default_branch: string;
      };
      const defaultBranch = repoData.default_branch;

      // Try to create branch, but don't fail if it exists
      try {
        const refResponse = await fetch(
          `${baseUrl}/repos/${repoPath}/git/ref/heads/${defaultBranch}`,
          { headers },
        );
        if (!refResponse.ok) {
          throw new Error(`Default branch "${defaultBranch}" not found`);
        }
        const refData = (await refResponse.json()) as {
          object: { sha: string };
        };
        const sha = refData.object.sha;

        await fetch(`${baseUrl}/repos/${repoPath}/git/refs`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: sha,
          }),
        });
      } catch (error) {
        // Ignore branch exists error
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string' &&
          error.message.includes('Reference already exists')
        ) {
          // Branch exists, continue
        } else {
          throw error;
        }
      }

      // Get current file SHA if it exists
      let fileSha: string | undefined;
      try {
        const fileResponse = await fetch(
          `${baseUrl}/repos/${repoPath}/contents/${filePath}?ref=${branchName}`,
          { headers },
        );
        if (fileResponse.ok) {
          const fileData = (await fileResponse.json()) as { sha: string };
          fileSha = fileData.sha;
        }
      } catch {
        // File doesn't exist yet, which is fine
      }

      // Update or create file
      const createFileResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Update SCSS variables from Figma',
          content: toBase64(content),
          branch: branchName,
          ...(fileSha && { sha: fileSha }), // Include SHA if file exists
        }),
      });

      if (!createFileResponse.ok) {
        const error = (await createFileResponse.json()) as { message: string };
        throw new Error(`Failed to update file: ${error.message}`);
      }

      // Check for existing PR
      const existingPRsResponse = await fetch(
        `${baseUrl}/repos/${repoPath}/pulls?head=${repoPath.split('/')[0]}:${branchName}&state=open`,
        { headers },
      );
      const existingPRs = (await existingPRsResponse.json()) as {
        html_url: string;
      }[];

      let prUrl: string;
      if (existingPRs.length > 0) {
        // Use existing PR
        prUrl = existingPRs[0].html_url;
      } else {
        // Create new PR
        const prResponse = await fetch(`${baseUrl}/repos/${repoPath}/pulls`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: 'Update SCSS variables from Figma',
            body: 'This PR was automatically created by the Figma SCSS plugin.',
            head: branchName,
            base: defaultBranch,
          }),
        });

        if (!prResponse.ok) {
          const error = (await prResponse.json()) as { message: string };
          throw new Error(`Failed to create PR: ${error.message}`);
        }
        const prData = (await prResponse.json()) as { html_url: string };
        prUrl = prData.html_url;
      }

      return {
        prUrl,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitHub API Error: ${error.message}`);
      }
      throw new Error('GitHub API Error: An unknown error occurred');
    }
  },
  createGitLabMR: async function createGitLabMR(
    token: string,
    repoPath: string,
    filePath: string,
    branchName: string,
    content: string,
    instanceUrl?: string | null,
  ): Promise<PRResult> {
    const baseUrl = getGitLabBaseUrl(instanceUrl);
    const projectId = encodeProjectPath(repoPath);
    const encodedFilePath = encodeFilePath(filePath);
    const headers = {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    };

    try {
      // Get project info and default branch
      const projectResponse = await fetch(`${baseUrl}/projects/${projectId}`, {
        headers,
      });
      if (!projectResponse.ok) {
        const errorData = await projectResponse.json().catch(() => ({}));
        throw new Error(
          `Project not found: ${repoPath}. ${(errorData as { message?: string }).message || ''}`,
        );
      }
      const projectData = (await projectResponse.json()) as {
        default_branch: string;
        id: number;
      };
      const defaultBranch = projectData.default_branch;

      // Try to create branch from default branch
      try {
        const branchResponse = await fetch(`${baseUrl}/projects/${projectId}/repository/branches`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            branch: branchName,
            ref: defaultBranch,
          }),
        });

        if (!branchResponse.ok) {
          const errorData = (await branchResponse.json().catch(() => ({}))) as {
            message?: string;
          };
          // If branch already exists, continue (400 error)
          if (!errorData.message?.includes('already exists')) {
            throw new Error(`Failed to create branch: ${errorData.message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        // Branch might already exist, continue
        if (
          error instanceof Error &&
          !error.message.includes('already exists') &&
          !error.message.includes('Branch already exists')
        ) {
          throw error;
        }
      }

      // Check if file exists to determine if we need to create or update
      let fileExists = false;
      try {
        const fileCheckResponse = await fetch(
          `${baseUrl}/projects/${projectId}/repository/files/${encodedFilePath}?ref=${branchName}`,
          { headers },
        );
        fileExists = fileCheckResponse.ok;
      } catch {
        // File doesn't exist
      }

      // Create or update file
      const fileMethod = fileExists ? 'PUT' : 'POST';
      const fileEndpoint = `${baseUrl}/projects/${projectId}/repository/files/${encodedFilePath}`;

      const fileResponse = await fetch(fileEndpoint, {
        method: fileMethod,
        headers,
        body: JSON.stringify({
          branch: branchName,
          content: toBase64(content),
          commit_message: 'Update SCSS variables from Figma',
          encoding: 'base64',
        }),
      });

      if (!fileResponse.ok) {
        const errorData = (await fileResponse.json().catch(() => ({}))) as { message?: string };
        throw new Error(`Failed to update file: ${errorData.message || 'Unknown error'}`);
      }

      // Check for existing MR
      const existingMRsResponse = await fetch(
        `${baseUrl}/projects/${projectId}/merge_requests?source_branch=${branchName}&state=opened`,
        { headers },
      );

      let prUrl: string;
      if (existingMRsResponse.ok) {
        const existingMRs = (await existingMRsResponse.json()) as {
          web_url: string;
        }[];

        if (existingMRs.length > 0) {
          // Use existing MR
          prUrl = existingMRs[0].web_url;
        } else {
          // Create new MR
          const mrResponse = await fetch(`${baseUrl}/projects/${projectId}/merge_requests`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              source_branch: branchName,
              target_branch: defaultBranch,
              title: 'Update SCSS variables from Figma',
              description: 'This merge request was automatically created by the Figma SCSS plugin.',
            }),
          });

          if (!mrResponse.ok) {
            const errorData = (await mrResponse.json().catch(() => ({}))) as { message?: string };
            throw new Error(
              `Failed to create merge request: ${errorData.message || 'Unknown error'}`,
            );
          }
          const mrData = (await mrResponse.json()) as { web_url: string };
          prUrl = mrData.web_url;
        }
      } else {
        // If we can't check for existing MRs, try to create one anyway
        const mrResponse = await fetch(`${baseUrl}/projects/${projectId}/merge_requests`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            source_branch: branchName,
            target_branch: defaultBranch,
            title: 'Update SCSS variables from Figma',
            description: 'This merge request was automatically created by the Figma SCSS plugin.',
          }),
        });

        if (!mrResponse.ok) {
          const errorData = (await mrResponse.json().catch(() => ({}))) as { message?: string };
          // If MR already exists, try to find it
          if (errorData.message?.includes('already exists')) {
            const allMRsResponse = await fetch(
              `${baseUrl}/projects/${projectId}/merge_requests?source_branch=${branchName}`,
              { headers },
            );
            if (allMRsResponse.ok) {
              const allMRs = (await allMRsResponse.json()) as { web_url: string }[];
              if (allMRs.length > 0) {
                prUrl = allMRs[0].web_url;
              } else {
                throw new Error(`Merge request exists but could not be found`);
              }
            } else {
              throw new Error(
                `Failed to create merge request: ${errorData.message || 'Unknown error'}`,
              );
            }
          } else {
            throw new Error(
              `Failed to create merge request: ${errorData.message || 'Unknown error'}`,
            );
          }
        } else {
          const mrData = (await mrResponse.json()) as { web_url: string };
          prUrl = mrData.web_url;
        }
      }

      return {
        prUrl,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API Error: ${error.message}`);
      }
      throw new Error('GitLab API Error: An unknown error occurred');
    }
  },
};
