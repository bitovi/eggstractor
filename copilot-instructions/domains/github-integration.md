# GitHub Integration Domain

## Overview

The GitHub integration domain manages repository operations, authentication, and automated git workflows. This system enables direct integration from Figma to GitHub repositories for seamless design-to-code workflows.

## GitHub Service Architecture

### File-Scoped Storage Pattern

All GitHub data is scoped to individual Figma files using unique identifiers:

```typescript
const getFileId = () => {
  let fileId = figma.root.getPluginData('customFileId');
  if (!fileId) {
    fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    figma.root.setPluginData('customFileId', fileId);
  }
  return fileId;
};
```

### Token Management

GitHub tokens are stored per-file in client storage:

```typescript
saveToken: async function (token: string) {
  const fileId = getFileId();
  const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
  const tokens = JSON.parse(userTokens);

  tokens[fileId] = token;
  await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
}
```

### Configuration Persistence

GitHub configurations are stored in plugin data:

```typescript
saveGithubConfig: async function saveGithubConfig(config: GithubConfig) {
  await figma.root.setPluginData('githubConfig', JSON.stringify(config));
}
```

## Pull Request Workflow

### Automated PR Creation

The system follows a complete git workflow:

```typescript
async createGithubPR(
  token: string,
  repoPath: string,
  filePath: string,
  branchName: string,
  content: string,
): Promise<PRResult> {
  // 1. Get repository information
  const repoInfo = await this.getRepository(token, repoPath);

  // 2. Create or update branch
  const branchRef = await this.createBranch(token, repoPath, branchName, repoInfo.default_branch);

  // 3. Update file content
  await this.updateFile(token, repoPath, filePath, content, branchName);

  // 4. Create pull request
  const pr = await this.createPullRequest(token, repoPath, {
    title: `Update ${filePath} via Eggstractor`,
    head: branchName,
    base: repoInfo.default_branch,
  });

  return { prUrl: pr.html_url };
}
```

### Base64 Encoding Utility

File content is properly encoded for GitHub API:

```typescript
export const toBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};
```

## API Integration Patterns

### REST API Communication

All GitHub operations use the REST API with consistent error handling:

```typescript
private async makeGithubRequest(url: string, options: RequestInit): Promise<any> {
  const response = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

This GitHub integration provides seamless automation of design-to-code workflows while maintaining security through proper token scoping and file-based isolation.
