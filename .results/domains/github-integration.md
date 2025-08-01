# GitHub Integration Domain

## Overview
External integration layer for GitHub operations including authentication, repository management, and pull request creation. This domain handles all interactions with GitHub's API for automated design token deployment.

## Core Implementation

### GitHub Service (`src/github.ts`)
```typescript
const Github = {
  // Token management with file-specific storage
  saveToken: async function (token: string) {
    const fileId = getFileId();
    const userTokens = (await figma.clientStorage.getAsync('userTokens')) || '{}';
    const tokens = JSON.parse(userTokens);
    tokens[fileId] = token;
    await figma.clientStorage.setAsync('userTokens', JSON.stringify(tokens));
  },

  getToken: async function (): Promise<string | null> {
    const fileId = getFileId();
    const userTokens = (await figma.clientStorage.getAsync('userTokens')) || '{}';
    const tokens = JSON.parse(userTokens);
    return tokens[fileId] || null;
  },

  // Branch management
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

  // Repository configuration
  saveGithubConfig: async function (config: {
    repoPath: string;
    filePath: string;
    outputFormat: string;
  }) {
    await figma.root.setPluginData('githubConfig', JSON.stringify(config));
  },

  getGithubConfig: async function () {
    try {
      const config = figma.root.getPluginData('githubConfig');
      return config ? JSON.parse(config) : {};
    } catch (error) {
      console.error('Error parsing GitHub config:', error);
      return {};
    }
  }
};
```

### Pull Request Creation Workflow
```typescript
// Main PR creation function coordinated from code.ts
const createPullRequest = async (
  githubToken: string,
  repoPath: string,
  filePath: string, 
  branchName: string,
  generatedContent: string
) => {
  try {
    const result = await Github.createGithubPR(
      githubToken,
      repoPath,
      filePath,
      branchName,
      generatedContent
    );
    
    // Notify UI of success
    figma.ui.postMessage({
      type: 'pr-created',
      prUrl: result.prUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    figma.ui.postMessage({ type: 'error', message });
  }
};
```

## Key Patterns

### 1. Repository Pattern for GitHub API
```typescript
interface GitHubRepository {
  createBranch(branchName: string): Promise<void>;
  updateFile(path: string, content: string, message: string): Promise<void>;
  createPullRequest(title: string, description: string): Promise<{ prUrl: string }>;
}

class GitHubAPIRepository implements GitHubRepository {
  constructor(private token: string, private repoPath: string) {}
  
  async createBranch(branchName: string): Promise<void> {
    // GitHub API implementation
  }
  
  async updateFile(path: string, content: string, message: string): Promise<void> {
    // GitHub API implementation  
  }
  
  async createPullRequest(title: string, description: string): Promise<{ prUrl: string }> {
    // GitHub API implementation
  }
}
```

### 2. Command Pattern for GitHub Operations
```typescript
interface GitHubCommand {
  execute(): Promise<any>;
  rollback?(): Promise<void>;
}

class CreatePullRequestCommand implements GitHubCommand {
  constructor(
    private repo: GitHubRepository,
    private config: PRConfig,
    private content: string
  ) {}
  
  async execute(): Promise<{ prUrl: string }> {
    // 1. Create or update branch
    await this.repo.createBranch(this.config.branchName);
    
    // 2. Update file with new content
    await this.repo.updateFile(
      this.config.filePath,
      this.content,
      `Update design tokens from Figma`
    );
    
    // 3. Create pull request
    return await this.repo.createPullRequest(
      `Design token update`,
      `Automated update from Eggstractor Figma plugin`
    );
  }
  
  async rollback(): Promise<void> {
    // Rollback logic if needed
  }
}
```

### 3. Adapter Pattern for API Integration
```typescript
class GitHubAdapter {
  constructor(private token: string) {}
  
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Specific API methods
  async getRepository(owner: string, repo: string) {
    return this.makeRequest(`/repos/${owner}/${repo}`);
  }
  
  async createBranch(owner: string, repo: string, branchName: string, sha: string) {
    return this.makeRequest(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha
      })
    });
  }
}
```

### 4. Configuration Management Pattern
```typescript
interface GitHubConfig {
  repoPath: string;    // "owner/repository"
  filePath: string;    // "src/styles/tokens.scss"
  branchName: string;  // "design-tokens-update"
  outputFormat: string; // "scss" | "css" | "tailwind-scss" | "tailwind-v4"
}

class GitHubConfigManager {
  private static readonly CONFIG_KEY = 'githubConfig';
  
  static async save(config: Partial<GitHubConfig>): Promise<void> {
    const existingConfig = await this.load();
    const mergedConfig = { ...existingConfig, ...config };
    await figma.root.setPluginData(this.CONFIG_KEY, JSON.stringify(mergedConfig));
  }
  
  static async load(): Promise<GitHubConfig> {
    try {
      const configData = figma.root.getPluginData(this.CONFIG_KEY);
      return configData ? JSON.parse(configData) : this.getDefaults();
    } catch (error) {
      console.error('Error loading GitHub config:', error);
      return this.getDefaults();
    }
  }
  
  private static getDefaults(): GitHubConfig {
    return {
      repoPath: '',
      filePath: 'src/styles/tokens.scss',
      branchName: 'design-tokens-update',
      outputFormat: 'scss'
    };
  }
}
```

## Security Considerations

### 1. Token Storage Security
```typescript
// Per-file token storage to prevent cross-contamination
const getFileId = (): string => {
  return figma.fileKey || 'unknown-file';
};

// Tokens are stored in Figma's secure clientStorage
const secureTokenStorage = {
  async store(token: string): Promise<void> {
    const fileId = getFileId();
    const encrypted = await encryptToken(token); // Hypothetical encryption
    const storage = await figma.clientStorage.getAsync('userTokens') || '{}';
    const tokens = JSON.parse(storage);
    tokens[fileId] = encrypted;
    await figma.clientStorage.setAsync('userTokens', JSON.stringify(tokens));
  },
  
  async retrieve(): Promise<string | null> {
    const fileId = getFileId();
    const storage = await figma.clientStorage.getAsync('userTokens') || '{}';
    const tokens = JSON.parse(storage);
    const encrypted = tokens[fileId];
    return encrypted ? await decryptToken(encrypted) : null;
  }
};
```

### 2. Input Validation
```typescript
const validateGitHubConfig = (config: any): GitHubConfig => {
  const errors: string[] = [];
  
  // Validate repository path format
  if (!config.repoPath || !/^[\w.-]+\/[\w.-]+$/.test(config.repoPath)) {
    errors.push('Repository path must be in format "owner/repository"');
  }
  
  // Validate file path
  if (!config.filePath || config.filePath.startsWith('/')) {
    errors.push('File path must be relative (no leading slash)');
  }
  
  // Validate branch name
  if (!config.branchName || !/^[\w.-\/]+$/.test(config.branchName)) {
    errors.push('Invalid branch name format');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
  
  return config as GitHubConfig;
};
```

### 3. Rate Limiting and Error Handling
```typescript
class RateLimitedGitHubClient {
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  
  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.requestQueue = this.requestQueue.then(async () => {
      // Ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => 
          setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        );
      }
      
      try {
        this.lastRequestTime = Date.now();
        return await requestFn();
      } catch (error) {
        if (this.isRateLimitError(error)) {
          // Exponential backoff for rate limit errors
          await this.handleRateLimit(error);
          return await requestFn(); // Retry once
        }
        throw error;
      }
    });
  }
  
  private isRateLimitError(error: any): boolean {
    return error.status === 429 || error.message?.includes('rate limit');
  }
  
  private async handleRateLimit(error: any): Promise<void> {
    const retryAfter = error.retryAfter || 60; // Default to 60 seconds
    console.warn(`Rate limited, waiting ${retryAfter} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }
}
```

## Branch Management Strategy

### 1. Branch Naming Conventions
```typescript
const generateBranchName = (config: GitHubConfig): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedName = config.branchName
    .replace(/[^a-zA-Z0-9-_.]/g, '-')  // Replace invalid chars
    .replace(/^-+|-+$/g, '')           // Remove leading/trailing dashes
    .replace(/-+/g, '-');              // Collapse multiple dashes
  
  return `${sanitizedName}-${timestamp}`;
};

// Example outputs:
// "design-tokens-update-2024-01-15"
// "figma-tokens-2024-01-15"
```

### 2. Branch Conflict Resolution
```typescript
const handleBranchConflicts = async (
  github: GitHubAdapter,
  repoPath: string,
  branchName: string
): Promise<string> => {
  const [owner, repo] = repoPath.split('/');
  
  try {
    // Check if branch exists
    await github.getBranch(owner, repo, branchName);
    
    // Branch exists, create a unique name
    const timestamp = Date.now();
    const uniqueBranchName = `${branchName}-${timestamp}`;
    
    console.log(`Branch ${branchName} exists, using ${uniqueBranchName}`);
    return uniqueBranchName;
  } catch (error) {
    if (error.status === 404) {
      // Branch doesn't exist, we can use the original name
      return branchName;
    }
    throw error; // Other errors should be handled upstream
  }
};
```

## File Update Strategy

### 1. Content Comparison
```typescript
const shouldUpdateFile = async (
  github: GitHubAdapter,
  repoPath: string,
  filePath: string,
  newContent: string
): Promise<boolean> => {
  try {
    const existingFile = await github.getFileContent(repoPath, filePath);
    const existingContent = Buffer.from(existingFile.content, 'base64').toString();
    
    // Compare content (ignoring whitespace differences)
    const normalizeContent = (content: string) => 
      content.replace(/\s+/g, ' ').trim();
    
    return normalizeContent(existingContent) !== normalizeContent(newContent);
  } catch (error) {
    if (error.status === 404) {
      return true; // File doesn't exist, should create it
    }
    throw error;
  }
};
```

### 2. Atomic File Updates
```typescript
const updateFileAtomically = async (
  github: GitHubAdapter,
  repoPath: string,
  filePath: string,
  content: string,
  message: string
): Promise<void> => {
  const [owner, repo] = repoPath.split('/');
  
  // Get current file SHA (required for updates)
  let sha: string | undefined;
  try {
    const existingFile = await github.getFileContent(owner, repo, filePath);
    sha = existingFile.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
    // File doesn't exist, SHA is undefined (will create new file)
  }
  
  // Update or create file
  await github.updateFile(owner, repo, filePath, {
    message,
    content: Buffer.from(content).toString('base64'),
    sha // Required for updates, omitted for new files
  });
};
```

## Error Handling and Recovery

### 1. Network Error Handling
```typescript
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};
```

### 2. User-Friendly Error Messages
```typescript
const formatGitHubError = (error: any): string => {
  if (error.status === 401) {
    return 'GitHub token is invalid or expired. Please check your token and try again.';
  }
  
  if (error.status === 403) {
    return 'Permission denied. Make sure your GitHub token has write access to the repository.';
  }
  
  if (error.status === 404) {
    return 'Repository or file not found. Please verify the repository path and file path.';
  }
  
  if (error.status === 422) {
    return 'Invalid request. Please check your branch name and file path.';
  }
  
  if (error.message?.includes('rate limit')) {
    return 'GitHub API rate limit exceeded. Please wait a few minutes and try again.';
  }
  
  return `GitHub API error: ${error.message || 'Unknown error occurred'}`;
};
```

## Integration Points

- **Figma Plugin Orchestration**: Receives PR creation commands and configuration
- **Output Transformation**: Gets generated stylesheet content for repository updates
- **UI Communication**: Provides status updates and error messages to the plugin UI

## Key Responsibilities

1. **Authentication Management**: Secure storage and validation of GitHub tokens
2. **Repository Operations**: Branch creation, file updates, and pull request management
3. **Configuration Persistence**: Save and load GitHub integration settings
4. **Error Handling**: Graceful handling of API failures and network issues
5. **Rate Limit Management**: Respect GitHub API limits and implement backoff strategies
6. **Security**: Validate inputs and protect against malicious repository access
