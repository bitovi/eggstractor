# GitHub Integration Style Guide

## Overview
GitHub integration handles authentication, file management, and pull request creation for pushing generated design tokens to GitHub repositories. It manages per-file token storage and repository configuration.

## File Structure
- `src/github.ts` - Complete GitHub API integration and client storage management

## Core Patterns

### File-Scoped Storage Pattern
```typescript
// Generate unique file ID for scoped storage
const getFileId = () => {
  let fileId = figma.root.getPluginData('customFileId');
  if (!fileId) {
    fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    figma.root.setPluginData('customFileId', fileId);
  }
  return fileId;
};
```

### Token Management Pattern
```typescript
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
  }
};
```

### Configuration Management Pattern
```typescript
interface GithubConfig {
  repoPath: string;
  filePath: string;
  outputFormat: string;
}

saveGithubConfig: async function (config: GithubConfig) {
  await figma.root.setPluginData('githubConfig', JSON.stringify(config));
},

getGithubConfig: async function (): Promise<GithubConfig | null> {
  try {
    const savedConfig = figma.root.getPluginData('githubConfig');
    return savedConfig ? JSON.parse(savedConfig) : {};
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
}
```

## GitHub API Integration

### Authentication Pattern
```typescript
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
};
```

### Repository Validation
```typescript
const repoResponse = await fetch(`${baseUrl}/repos/${repoPath}`, { headers });
if (!repoResponse.ok) {
  throw new Error(`Repository not found: ${repoPath}`);
}
```

### Branch Management
```typescript
// Get default branch reference
const refResponse = await fetch(
  `${baseUrl}/repos/${repoPath}/git/ref/heads/${defaultBranch}`,
  { headers }
);

// Create new branch from default
await fetch(`${baseUrl}/repos/${repoPath}/git/refs`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ref: `refs/heads/${branchName}`,
    sha: defaultSha
  })
});
```

### File Operations
```typescript
// Check if file exists
const fileResponse = await fetch(
  `${baseUrl}/repos/${repoPath}/contents/${filePath}?ref=${branchName}`,
  { headers }
);

// Create or update file
await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
  method: 'PUT',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: commitMessage,
    content: toBase64(content),
    branch: branchName,
    sha: existingFile?.sha // Include for updates
  })
});
```

### Pull Request Creation
```typescript
const prResponse = await fetch(`${baseUrl}/repos/${repoPath}/pulls`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Update Design Tokens',
    head: branchName,
    base: defaultBranch,
    body: 'Automated update of design tokens from Figma'
  })
});
```

## Storage Management

### Per-File Token Storage
```typescript
// Store tokens per Figma file
const fileId = getFileId();
const userTokens = JSON.parse(await figma.clientStorage.getAsync('fileTokens') || '{}');
userTokens[fileId] = token;
```

### Branch Name Persistence
```typescript
saveBranchName: async function (branchName: string) {
  const fileId = getFileId();
  const userBranches = JSON.parse(await figma.clientStorage.getAsync('fileBranches') || '{}');
  userBranches[fileId] = branchName;
  await figma.clientStorage.setAsync('fileBranches', JSON.stringify(userBranches));
}
```

### Plugin Data Storage
```typescript
// Store configuration in plugin data (persistent with file)
await figma.root.setPluginData('githubConfig', JSON.stringify(config));

// Retrieve configuration
const savedConfig = figma.root.getPluginData('githubConfig');
const config = savedConfig ? JSON.parse(savedConfig) : {};
```

## Error Handling

### API Error Handling
```typescript
try {
  const response = await fetch(apiUrl, options);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('GitHub API error:', error);
  throw error;
}
```

### Storage Error Handling
```typescript
try {
  const savedConfig = figma.root.getPluginData('githubConfig');
  return savedConfig ? JSON.parse(savedConfig) : {};
} catch (error) {
  console.error('Error reading config:', error);
  return null;
}
```

### Branch Creation Resilience
```typescript
// Try to create branch, but don't fail if it exists
try {
  await createBranch(branchName);
} catch (error) {
  // Branch might already exist, continue with file operations
  console.warn('Branch creation failed, may already exist:', error);
}
```

## Best Practices

### 1. File-Scoped Storage
Scope storage to individual Figma files:
```typescript
const fileId = getFileId(); // Unique per file
const fileSpecificData = userData[fileId];
```

### 2. Graceful Degradation
Handle missing configurations gracefully:
```typescript
const config = savedConfig ? JSON.parse(savedConfig) : getDefaultConfig();
```

### 3. Base64 Encoding
Encode file content for GitHub API:
```typescript
import { toBase64 } from './utils/index';
const encodedContent = toBase64(fileContent);
```

### 4. Async/Await Pattern
Use async/await for API operations:
```typescript
const result = await fetch(url, options);
const data = await result.json();
```

### 5. Configuration Validation
Validate required configuration before API calls:
```typescript
if (!token || !repoPath || !filePath) {
  throw new Error('Missing required GitHub configuration');
}
```

## Security Considerations

### Token Storage
- Store tokens in Figma's secure client storage
- Scope tokens to individual files
- Never log or expose tokens in error messages

### API Rate Limiting
- Handle rate limiting responses gracefully
- Implement exponential backoff for retries

### Repository Access
- Validate repository access before operations
- Handle permission errors appropriately

## Testing Requirements
- Test token storage and retrieval
- Test configuration persistence
- Test GitHub API integration with mocked responses
- Test error handling for network failures
- Test branch creation and file operations
- Test pull request creation flow
- Validate security practices for token handling
