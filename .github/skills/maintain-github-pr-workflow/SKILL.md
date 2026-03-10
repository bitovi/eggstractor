---
name: maintain-github-pr-workflow
description: Provides an agent with the knowledge needed to safely modify, debug, or extend the GitHub PR creation workflow without breaking the branch, commit, or PR lifecycle.
---

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

1. `GET /repos/{owner}/{repo}` → get `default_branch`; throws if repo not found
2. `GET /repos/{owner}/{repo}/git/ref/heads/{default_branch}` → get HEAD SHA
3. `POST /repos/{owner}/{repo}/git/refs` → create branch; silently ignores `'Reference already exists'` error
4. `GET /repos/{owner}/{repo}/contents/{filePath}?ref={branchName}` → get existing file SHA (needed for update; omitted if file is new)
5. `PUT /repos/{owner}/{repo}/contents/{filePath}` → commit file (base64-encoded content via `toBase64()`)
6. `GET /repos/{owner}/{repo}/pulls?head={owner}:{branchName}&state=open` → check for existing open PR
7. `POST /repos/{owner}/{repo}/pulls` → create PR **only if step 6 returned none**; extract `html_url`

## Known Behaviors

- **Idempotency:** If an open PR already exists for `branchName`, the existing PR URL is returned without creating a duplicate.
- Content encoded via `toBase64(content)` from `packages/figma/src/utils/string.utils.ts` before commit
- If branch already exists, branch creation step is silently skipped
- If file already exists, step 4 provides `sha` required for the step 5 PUT update
- Base URL is hardcoded to `https://api.github.com`
- Authentication: `Authorization: Bearer {token}` + `Accept: application/vnd.github.v3+json` on all requests
- All failures caught and re-thrown as `GitHub API Error: {message}`
- PR title: `'Update SCSS variables from Figma'`; body: `'This PR was automatically created by the Figma SCSS plugin.'`

## TODO

- [ ] Document error handling when token has insufficient scope
- [ ] Document `encodeFilePath()` behavior for paths with special characters
