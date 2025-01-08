namespace Github {
  export async function createGithubPR(token: string, repoPath: string, filePath: string, branchName: string, content: string) {
    const baseUrl = 'https://api.github.com';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    try {
      // Get default branch
      const repoResponse = await fetch(`${baseUrl}/repos/${repoPath}`, {
        headers
      });
      if (!repoResponse.ok) {
        throw new Error(`Repository not found: ${repoPath}`);
      }
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch;

      // Get the SHA of the default branch
      const refResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/ref/heads/${defaultBranch}`, {
        headers
      });
      if (!refResponse.ok) {
        throw new Error(`Default branch "${defaultBranch}" not found`);
      }
      const refData = await refResponse.json();
      const sha = refData.object.sha;

      // Create new branch
      const createBranchResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/refs`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sha,
          force: true
        })
      });

      // Add more detailed error logging
      if (!createBranchResponse.ok) {
        const error = await createBranchResponse.json();
        console.error('Branch creation failed:', {
          status: createBranchResponse.status,
          statusText: createBranchResponse.statusText,
          error,
          requestData: {
            ref: `refs/heads/${branchName}`,
            sha,
            repoPath
          }
        });

        if (!error.message.includes('Reference already exists')) {
          throw new Error(`Failed to create branch: ${error.message}`);
        }
      }

      const createFileResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Update SCSS variables from Figma',
          content: Utils.toBase64(content),
          branch: branchName
        })
      });
      if (!createFileResponse.ok) {
        const error = await createFileResponse.json();
        throw new Error(`Failed to create file: ${error.message}`);
      }

      // Create PR
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
      return prData.html_url;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitHub API Error: ${error.message}`);
      }
      throw new Error('GitHub API Error: An unknown error occurred');
    }
  }
}