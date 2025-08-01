# GitHub Integration Style Guide

## Token Storage Pattern

Use file-specific token storage for multi-repository support:

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

## Configuration Persistence

Store configuration in plugin data with JSON serialization:

```typescript
saveGithubConfig: async function (config: {
  repoPath: string;
  filePath: string;  
  outputFormat: string;
}) {
  await figma.root.setPluginData('githubConfig', JSON.stringify(config));
}
```

## REST API Headers

Use consistent headers for all GitHub API requests:

```typescript
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
};
```

## Error Context Pattern

Provide specific error context for different failure scenarios:

```typescript
if (!repoResponse.ok) {
  throw new Error(`Repository not found: ${repoPath}`);
}

if (!createBranchResponse.ok) {
  throw new Error(`Failed to create branch: ${branchName}`);
}
```

## Base64 Content Encoding

All file content must be base64 encoded for GitHub API:

```typescript
import { toBase64 } from './utils/index';

const updateFileResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    message: `Update ${filePath} with generated styles`,
    content: toBase64(content),  // Must be base64 encoded
    branch: branchName,
    sha: currentFileSha,
  }),
});
```

## Branch Workflow Sequence

Follow exact sequence for Git operations:

1. Get repository default branch
2. Get latest commit SHA
3. Create new branch from SHA
4. Update file content on new branch
5. Create pull request

## PR Message Convention

Use consistent PR titles and descriptions:

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

## Network Domain Restrictions

All requests must target allowed domains from manifest.json:

```json
"networkAccess": {
  "allowedDomains": ["https://api.github.com"]
}
```
