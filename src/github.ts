import Utils from './utils';

export interface PRResult {
  prUrl: string;
}

export default {
  saveGithubToken: async function saveGithubToken(token: string) {
    await figma.clientStorage.setAsync('githubToken', token);
  },
  getGithubToken: async function getGithubToken(): Promise<string | null> {
    return figma.clientStorage.getAsync('githubToken');
  },
  saveGithubConfig: async function saveGithubConfig(config: {
    repoPath: string;
    filePath: string;
    branchName: string;
  }) {
    await figma.root.setPluginData('githubConfig', JSON.stringify(config));
  },
  getGithubConfig: async function getGithubConfig() {
    try {
      const savedConfig = figma.root.getPluginData('githubConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : {};
      return config;
    } catch (error) {
      console.error('Error reading config:', error);
      return null;
    }
  },
  createGithubPR: async function createGithubPR(token: string, repoPath: string, filePath: string, branchName: string, content: string): Promise<PRResult> {
    const baseUrl = 'https://api.github.com';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    try {
      // Get default branch
      const repoResponse = await fetch(`${baseUrl}/repos/${repoPath}`, { headers });
      if (!repoResponse.ok) {
        throw new Error(`Repository not found: ${repoPath}`);
      }
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch;

      // Try to create branch, but don't fail if it exists
      try {
        const refResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/ref/heads/${defaultBranch}`, { headers });
        if (!refResponse.ok) {
          throw new Error(`Default branch "${defaultBranch}" not found`);
        }
        const refData = await refResponse.json();
        const sha = refData.object.sha;

        await fetch(`${baseUrl}/repos/${repoPath}/git/refs`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: sha
          })
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
          { headers }
        );
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileSha = fileData.sha;
        }
      } catch (error) {
        // File doesn't exist yet, which is fine
      }

      // Update or create file
      const createFileResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Update SCSS variables from Figma',
          content: Utils.toBase64(content),
          branch: branchName,
          ...(fileSha && { sha: fileSha }) // Include SHA if file exists
        })
      });

      if (!createFileResponse.ok) {
        const error = await createFileResponse.json();
        throw new Error(`Failed to update file: ${error.message}`);
      }

      // Check for existing PR
      const existingPRsResponse = await fetch(
        `${baseUrl}/repos/${repoPath}/pulls?head=${repoPath.split('/')[0]}:${branchName}&state=open`,
        { headers }
      );
      const existingPRs = await existingPRsResponse.json();

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
            base: defaultBranch
          })
        });

        if (!prResponse.ok) {
          const error = await prResponse.json();
          throw new Error(`Failed to create PR: ${error.message}`);
        }
        const prData = await prResponse.json();
        prUrl = prData.html_url;
      }

      return {
        prUrl
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitHub API Error: ${error.message}`);
      }
      throw new Error('GitHub API Error: An unknown error occurred');
    }
  }
}