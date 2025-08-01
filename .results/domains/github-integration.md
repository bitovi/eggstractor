# GitHub Integration Domain

The GitHub integration domain handles automated repository operations, including branch creation, file commits, and pull request generation. It uses the GitHub REST API with Personal Access Token authentication.

## Authentication System

The plugin uses file-specific token storage to manage multiple repositories:

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

## Token Management

Tokens are stored per-file to support different repositories:

```typescript
saveToken: async function (token: string) {
  const fileId = getFileId();
  const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
  const tokens = JSON.parse(userTokens);
  tokens[fileId] = token;
  await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
}
```

## Configuration Persistence

GitHub configuration is stored in plugin data:

```typescript
saveGithubConfig: async function (config: {
  repoPath: string;
  filePath: string;
  outputFormat: string;
}) {
  await figma.root.setPluginData('githubConfig', JSON.stringify(config));
}
```

## PR Creation Workflow

The pull request creation follows a standard Git workflow:

1. **Get Repository Information**
```typescript
const repoResponse = await fetch(`${baseUrl}/repos/${repoPath}`, { headers });
```

2. **Get Default Branch SHA**
```typescript
const defaultBranchRef = await fetch(`${baseUrl}/repos/${repoPath}/git/ref/heads/${defaultBranch}`);
```

3. **Create New Branch**
```typescript
const createBranchResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/refs`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    ref: `refs/heads/${branchName}`,
    sha: latestCommitSha,
  }),
});
```

4. **Commit File Changes**
```typescript
const updateFileResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    message: `Update ${filePath} with generated styles`,
    content: toBase64(content),
    branch: branchName,
    sha: currentFileSha,
  }),
});
```

5. **Create Pull Request**
```typescript
const createPRResponse = await fetch(`${baseUrl}/repos/${repoPath}/pulls`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: `Update ${filePath} with generated styles`,
    head: branchName,
    base: defaultBranch,
    body: 'Generated styles from Figma using Eggstractor plugin.',
  }),
});
```

## Base64 Encoding

File content must be base64 encoded for the GitHub API:

```typescript
import { toBase64 } from './utils/index';
const content = toBase64(generatedStyles);
```

## Error Handling

The integration propagates GitHub API errors with context:

```typescript
if (!repoResponse.ok) {
  throw new Error(`Repository not found: ${repoPath}`);
}
```

## Network Access Constraints

Network requests are limited to `https://api.github.com` as specified in the plugin manifest. All requests use the GitHub REST API v3 with proper headers and authentication.
