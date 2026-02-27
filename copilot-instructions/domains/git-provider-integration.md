# Git Provider Integration Domain

## Overview

The Git Provider integration domain manages repository operations, authentication, and automated git workflows for both GitHub and GitLab. This system enables direct integration from Figma to GitHub or GitLab repositories for seamless design-to-code workflows.

## Service Architecture

### File-Scoped Storage Pattern

All git provider data is scoped to individual Figma files using unique identifiers:

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

Tokens are stored per-file in client storage:

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

Git provider configurations are stored in plugin data:

```typescript
saveGitProviderConfig: async function saveGitProviderConfig(config: GitProviderConfig) {
  await figma.root.setPluginData('gitProviderConfig', JSON.stringify(config));
}
```

## Provider Configuration

### GitProviderConfig Interface

```typescript
interface GitProviderConfig {
  provider: 'github' | 'gitlab'; // Defaults to 'github' for backward compatibility
  repoPath: string; // 'owner/repo' format for both providers
  filePath: string; // Relative path from repository root
  branchName: string; // Branch for PRs/MRs
  authToken: string; // Authentication token
  instanceUrl?: string; // Optional: for self-hosted GitLab instances
  format: StylesheetFormat; // Output format (scss, tailwind, etc.)
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
}
```

## Pull Request / Merge Request Workflow

### Main Router Function

The system routes to the appropriate provider:

```typescript
async function createPR(
  provider: GitProvider,
  token: string,
  repoPath: string,
  filePath: string,
  branchName: string,
  content: string,
  instanceUrl?: string,
): Promise<PRResult> {
  if (provider === 'gitlab') {
    return createGitLabMR(token, repoPath, filePath, branchName, content, instanceUrl);
  }
  return createGitHubPR(token, repoPath, filePath, branchName, content);
}
```

### GitHub PR Creation

GitHub follows a complete git workflow using the GitHub REST API:

```typescript
async createGitHubPR(
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

### GitLab MR Creation

GitLab follows a similar workflow using the GitLab REST API v4:

```typescript
async createGitLabMR(
  token: string,
  repoPath: string,
  filePath: string,
  branchName: string,
  content: string,
  instanceUrl?: string,
): Promise<PRResult> {
  const baseUrl = getGitLabBaseUrl(instanceUrl);
  const encodedProject = encodeProjectPath(repoPath);

  // 1. Get project information
  const project = await this.getGitLabProject(token, encodedProject, baseUrl);

  // 2. Create or update branch
  await this.createGitLabBranch(token, encodedProject, branchName, project.default_branch, baseUrl);

  // 3. Update file content
  await this.updateGitLabFile(token, encodedProject, filePath, content, branchName, baseUrl);

  // 4. Create merge request
  const mr = await this.createGitLabMR(token, encodedProject, {
    title: `Update ${filePath} via Eggstractor`,
    source_branch: branchName,
    target_branch: project.default_branch,
  }, baseUrl);

  return { prUrl: mr.web_url };
}
```

### Base64 Encoding Utility

File content is properly encoded for both GitHub and GitLab APIs:

```typescript
export const toBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};
```

## API Integration Patterns

### GitHub REST API Communication

GitHub operations use the REST API with Bearer token authentication:

```typescript
private async makeGithubRequest(url: string, options: RequestInit): Promise<any> {
  const response = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
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

### GitLab REST API Communication

GitLab operations use the REST API v4 with PRIVATE-TOKEN authentication:

```typescript
private async makeGitLabRequest(url: string, token: string, options: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitLab API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}
```
