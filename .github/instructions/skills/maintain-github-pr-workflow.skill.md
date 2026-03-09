# Skill: MaintainGitHubPRWorkflow

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the GitHub PR creation workflow without breaking the branch, commit, or PR lifecycle.

## Implementation

- File: `packages/figma/src/git-provider.ts`
- Method: `GitProvider.createGitHubPR(authToken, repoPath, filePath, branchName, content)`

## Input

```typescript
authToken: string; // GitHub personal access token
repoPath: string; // 'owner/repo'
filePath: string; // target file path in repo (e.g., 'styles/tokens.scss')
branchName: string; // feature branch name
content: string; // stylesheet string (will be base64-encoded)
```

## Output

```typescript
Promise<PRResult>;
// PRResult = { prUrl: string }
```

## API Call Sequence

1. `GET /repos/{owner}/{repo}` → get `default_branch`
2. `GET /repos/{owner}/{repo}/git/refs/heads/{default_branch}` → get HEAD SHA
3. `POST /repos/{owner}/{repo}/git/refs` → create branch (skip if exists)
4. `GET /repos/{owner}/{repo}/contents/{filePath}` → get existing file SHA (if updating)
5. `PUT /repos/{owner}/{repo}/contents/{filePath}` → commit file (base64 content)
6. `POST /repos/{owner}/{repo}/pulls` → create PR → extract `html_url`

## Known Behaviors

- Content encoded via `toBase64(content)` before commit
- If branch already exists, branch creation step is skipped (no error)
- If file already exists, step 4 provides `sha` required for step 5 update

## TODO

- [ ] Document error handling when repo does not exist or token has insufficient scope
- [ ] Document PR title and body defaults
- [ ] Document `encodeFilePath()` behavior for paths with special characters
- [ ] Document what happens when the PR already exists for the branch
- [ ] Document GitHub API base URL configuration (is it hardcoded to `api.github.com`?)
