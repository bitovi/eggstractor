import { GithubConfig } from './types';
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

export default {
  saveToken: async function (token: string) {
    const fileId = getFileId();
    const userTokens =
      (await figma.clientStorage.getAsync('fileTokens')) || '{}';
    const tokens = JSON.parse(userTokens);

    tokens[fileId] = token;
    await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
  },
  getToken: async function (): Promise<string | null> {
    const fileId = getFileId();
    const userTokens =
      (await figma.clientStorage.getAsync('fileTokens')) || '{}';
    const tokens = JSON.parse(userTokens);

    return tokens[fileId] || null;
  },
  saveBranchName: async function (branchName: string) {
    const fileId = getFileId();
    const userBranches =
      (await figma.clientStorage.getAsync('fileBranches')) || '{}';
    const branches = JSON.parse(userBranches);
    branches[fileId] = branchName;
    await figma.clientStorage.setAsync(
      'fileBranches',
      JSON.stringify(branches),
    );
  },
  getBranchName: async function (): Promise<string | null> {
    const fileId = getFileId();
    const userBranches =
      (await figma.clientStorage.getAsync('fileBranches')) || '{}';
    const branches = JSON.parse(userBranches);
    return branches[fileId] || null;
  },
  saveGithubConfig: async function saveGithubConfig(config: GithubConfig) {
    await figma.root.setPluginData('githubConfig', JSON.stringify(config));
  },
  getGithubConfig: async function getGithubConfig() {
    try {
      const savedConfig = figma.root.getPluginData('githubConfig');
      const config = savedConfig
        ? (JSON.parse(savedConfig) as GithubConfig)
        : null;
      return config;
    } catch (error) {
      console.error('Error reading config:', error);
      return null;
    }
  },
  createGithubPR: async function createGithubPR(
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
      const createFileResponse = await fetch(
        `${baseUrl}/repos/${repoPath}/contents/${filePath}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: 'Update SCSS variables from Figma',
            content: toBase64(content),
            branch: branchName,
            ...(fileSha && { sha: fileSha }), // Include SHA if file exists
          }),
        },
      );

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
};
