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
// Returns instanceUrl ?? 'https://gitlab.com'

encodeProjectPath(repoPath: string): string
// URI-encodes 'group/project' → 'group%2Fproject' for use in API path
```

## Known Behaviors

- All API calls prefixed with `getGitLabBaseUrl(instanceUrl) + '/api/v4'`
- `encodeProjectPath()` handles nested subgroups
- Content encoded via `toBase64(content)` before commit

## TODO

- [ ] Document commit message format used in step 5
- [ ] Document MR title and description defaults
- [ ] Document error handling for self-hosted instances with custom SSL
- [ ] Document behavior when MR already exists for the branch
- [ ] Document `encodeFilePath()` vs. `encodeProjectPath()` — same function or different?
- [ ] Confirm `web_url` field name in GitLab MR response
