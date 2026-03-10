---
name: maintain-gitlab-mr-workflow
description: Provides an agent with the knowledge needed to safely modify, debug, or extend the GitLab MR creation workflow without breaking branch creation, file commit, or MR lifecycle — including self-hosted in
---

# Skill: MaintainGitLabMRWorkflow

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the GitLab MR creation workflow without breaking branch creation, file commit, or MR lifecycle — including self-hosted instance support.

## Implementation

- File: `packages/figma/src/git-provider.ts`
- Method: `GitProvider.createGitLabMR(authToken, repoPath, filePath, branchName, content, instanceUrl?)`

## Input

```typescript
authToken: string       // GitLab personal access token
repoPath: string        // 'group/project' (URL-encoded for API calls)
filePath: string        // target file path in repo
branchName: string      // feature branch name
content: string         // stylesheet string (base64-encoded)
instanceUrl?: string    // self-hosted GitLab base URL (default: 'https://gitlab.com')
```

## Output

```typescript
Promise<PRResult>;
// PRResult = { prUrl: string }
```

## API Call Sequence

1. `GET /projects/{encodedPath}` → get `default_branch`
2. `GET /repository/branches/{default_branch}` → get HEAD commit SHA
3. `POST /repository/branches` → create branch (skip if exists)
4. `GET /repository/files/{encodedFilePath}` → check file existence
5. `POST /repository/files/{encodedFilePath}` (create) or `PUT` (update) → commit file
6. `POST /merge_requests` → create MR → extract `web_url`

## Key Internal Helpers

```typescript
getGitLabBaseUrl(instanceUrl?: string | null): string
// Strips any http:// or https:// prefix from instanceUrl, defaults host to 'gitlab.com',
// then always appends '/api/v4'.
// e.g.: 'https://gitlab.company.com' → 'https://gitlab.company.com/api/v4'
// e.g.: null → 'https://gitlab.com/api/v4'

encodeProjectPath(repoPath: string): string
// Applies encodeURIComponent to the full 'group/project' string.
// e.g.: 'owner/repo' → 'owner%2Frepo'

encodeFilePath(path: string): string
// Applies encodeURIComponent to the file path for use in repository-files API paths.
// Different from encodeProjectPath — separate functions.
```

## Known Behaviors

- **Idempotency:** If an open MR already exists for `branchName`, the existing MR URL (`web_url`) is returned without creating a duplicate (step 5 check → step 6 conditional create)
- **Pre-flight validation:** `authToken`, `repoPath`, `filePath`, and `branchName` are all validated as non-empty strings before any API call; each throws a descriptive error if missing
- **401 errors** surface a token-scope hint (`api` scope required) and link to PAT settings
- **404 errors** on project fetch surface a project-path format reminder (e.g., `username/project-name`)
- Authentication: `PRIVATE-TOKEN: {token}` header on all requests (no `Bearer` prefix)
- Content encoded via `toBase64(content)` from `packages/figma/src/utils/string.utils.ts` before commit
- All failures caught and re-thrown as `GitLab API Error: {message}`
- MR title: `'Update SCSS variables from Figma'`; description: `'This merge request was automatically created by the Figma SCSS plugin.'`

## TODO

- [ ] Document error handling for self-hosted instances with custom SSL
- [ ] Document `encodeFilePath()` behavior for paths with special characters or nested directories
