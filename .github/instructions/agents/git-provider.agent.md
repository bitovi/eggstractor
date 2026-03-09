# Agent: GitProviderAgent

## Purpose

Owns all git integration: GitHub PR and GitLab MR creation workflows, token/config persistence in Figma client storage, and the REST API communication lifecycle (get repo info → create/update branch → commit file → open PR/MR).

## Source Files

- `packages/figma/src/git-provider.ts` — default export with all git provider methods
- `packages/common/src/types/github-config.ts` — `GitProviderConfig`, `GitProvider`
- `packages/common/src/types/message-to-main-thread-payload.ts` — `CreatePRPayload`, `SaveConfigPayload`
- `packages/common/src/types/message-to-ui-payload.ts` — `PRCreatedPayload`, `PRCreatingPayload`, `ErrorPayload`
- `packages/figma/src/utils/string.utils.ts` — `toBase64()`

## Skills Used

- [MaintainGitHubPRWorkflow](../skills/maintain-github-pr-workflow.skill.md)
- [MaintainGitLabMRWorkflow](../skills/maintain-gitlab-mr-workflow.skill.md)
- [MaintainGitProviderConfigStorage](../skills/maintain-git-provider-config-storage.skill.md)

## Domain Knowledge

### `GitProviderConfig` Shape

> **Warning** (`github-config.ts`): "This type is a little shaky and likely to change." The `provider`, `authToken`, and `branchName` fields are all optional/nullable — callers must handle absence of each.

```typescript
interface GitProviderConfig {
  provider?: GitProvider; // 'github' | 'gitlab'; optional, defaults to 'github' for backward compatibility
  repoPath: string; // 'owner/repo' for GitHub, 'group/project' for GitLab
  filePath: string; // Relative path from repository root
  format: string; // StylesheetFormat (scss, tailwind, etc.)
  authToken?: string | null; // Personal access token; optional/nullable
  branchName?: string | null; // Feature branch for PRs/MRs; optional/nullable
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
  instanceUrl?: string | null; // Self-hosted GitLab base domain (e.g., 'gitlab.company.com'); null = gitlab.com
}
```

### Provider Detection

`createPR()` dispatches to `createGitHubPR()` or `createGitLabMR()` based on `provider` field. Provider detection is explicit — there is no URL-sniffing fallback.

```typescript
async function createPR(
  provider: GitProvider,
  authToken: string,
  repoPath: string,
  filePath: string,
  branchName: string,
  content: string,
  instanceUrl?: string | null,
): Promise<PRResult> {
  if (provider === 'gitlab') {
    return createGitLabMR(authToken, repoPath, filePath, branchName, content, instanceUrl);
  }
  return createGitHubPR(authToken, repoPath, filePath, branchName, content);
}
```

### GitHub PR Lifecycle

1. GET `/repos/{owner}/{repo}` — fetch default branch name
2. GET `/repos/{owner}/{repo}/git/ref/heads/{default}` — get SHA of default branch HEAD
3. POST `/repos/{owner}/{repo}/git/refs` — create feature branch; silently ignores `'Reference already exists'` error
4. GET `/repos/{owner}/{repo}/contents/{filePath}?ref={branchName}` — get existing file SHA (needed for update; omitted if file is new)
5. PUT `/repos/{owner}/{repo}/contents/{filePath}` — commit file (base64-encoded content via `toBase64()`); commit message: `'Update SCSS variables from Figma'`
6. GET `/repos/{owner}/{repo}/pulls?head={owner}:{branchName}&state=open` — check for existing open PR
7. POST `/repos/{owner}/{repo}/pulls` — create PR only if step 6 returned none; title: `'Update SCSS variables from Figma'`; body: `'This PR was automatically created by the Figma SCSS plugin.'`

**Idempotency**: If an open PR already exists for `branchName`, the existing PR URL is returned without creating a duplicate.

**Authentication**: `Authorization: Bearer {token}` + `Accept: application/vnd.github.v3+json` headers on all requests.

```typescript
const headers = {
  Authorization: `Bearer ${authToken}`,
  Accept: 'application/vnd.github.v3+json',
  // For write operations, also add: 'Content-Type': 'application/json'
};
```

**Error wrapping**: All failures are caught and re-thrown as `GitHub API Error: {message}`.

### GitLab MR Lifecycle

**Pre-flight validation**: `authToken`, `repoPath`, `filePath`, and `branchName` are all validated as non-empty strings before any API call; each throws a descriptive error if missing.

1. GET `/projects/{encodedProjectPath}` — fetch project info (`default_branch`, `id`); surfaces 401 / 404-specific error messages:
   - 401: Includes token-scope hint (`api` scope required) and link to PAT settings page
   - 404: Includes project-path format reminder (e.g., `username/project-name`)
2. POST `/projects/{encodedProjectPath}/repository/branches` — create feature branch from default; silently ignores `'already exists'` responses
3. GET `/projects/{encodedProjectPath}/repository/files/{encodedFilePath}?ref={branchName}` — check if file exists (determines POST vs. PUT)
4. POST or PUT `/projects/{encodedProjectPath}/repository/files/{encodedFilePath}` — commit file (base64-encoded content, `encoding: 'base64'`); commit message: `'Update SCSS variables from Figma'`
5. GET `/projects/{encodedProjectPath}/merge_requests?source_branch={branchName}&state=opened` — check for existing open MR
6. POST `/projects/{encodedProjectPath}/merge_requests` — create MR only if step 5 returned none; title: `'Update SCSS variables from Figma'`; description: `'This merge request was automatically created by the Figma SCSS plugin.'`

**Idempotency**: If an open MR already exists for `branchName`, the existing MR URL is returned without creating a duplicate.

**Authentication**: `PRIVATE-TOKEN: {token}` header on all GitLab requests (no `Bearer` prefix).

```typescript
const headers = {
  'PRIVATE-TOKEN': authToken,
  'Content-Type': 'application/json',
};
```

**Error wrapping**: All failures are caught and re-thrown as `GitLab API Error: {message}`.

### Self-Hosted GitLab

`getGitLabBaseUrl(instanceUrl?)` strips any user-provided protocol prefix and always appends `/api/v4`:

```typescript
const getGitLabBaseUrl = (instanceUrl?: string | null): string => {
  const host = instanceUrl && instanceUrl.trim() ? instanceUrl.trim() : 'gitlab.com';
  const cleanHost = host.replace(/^https?:\/\//, '');
  return `https://${cleanHost}/api/v4`;
};
```

Default base URL (no `instanceUrl`): `https://gitlab.com/api/v4`.

`encodeProjectPath(repoPath)` applies `encodeURIComponent` to the full `group/project` string (e.g., `owner/repo` → `owner%2Frepo`) for use in GitLab REST API paths.

`encodeFilePath(path)` applies `encodeURIComponent` to the file path for use in GitLab repository-files API paths.

### Storage Keys

Storage is split across two Figma persistence mechanisms:

| Data            | Mechanism                  | Key                                                         |
| --------------- | -------------------------- | ----------------------------------------------------------- |
| Auth token      | `figma.clientStorage`      | `'fileTokens'` (JSON map: `fileId → token`)                 |
| Branch name     | `figma.clientStorage`      | `'fileBranches'` (JSON map: `fileId → branchName`)          |
| Provider config | `figma.root.setPluginData` | `'gitProviderConfig'` (JSON-serialized `GitProviderConfig`) |
| File identity   | `figma.root.getPluginData` | `'customFileId'` (generated once, stable per Figma file)    |

> **Important**: `saveGitProviderConfig` uses `setPluginData`, NOT `clientStorage`. Token and branch use `clientStorage` so they persist across devices; config is document-scoped via plugin data.

### Storage Implementations

`getFileId()` — generates and persists a stable per-file identifier:

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

`saveToken()` — stores token per-file in `fileTokens` map:

```typescript
saveToken: async function (token: string) {
  const fileId = getFileId();
  const userTokens = (await figma.clientStorage.getAsync('fileTokens')) || '{}';
  const tokens = JSON.parse(userTokens);
  tokens[fileId] = token;
  await figma.clientStorage.setAsync('fileTokens', JSON.stringify(tokens));
}
```

`saveBranchName()` — stores branch name per-file in `fileBranches` map:

```typescript
saveBranchName: async function (branchName: string) {
  const fileId = getFileId();
  const userBranches = (await figma.clientStorage.getAsync('fileBranches')) || '{}';
  const branches = JSON.parse(userBranches);
  branches[fileId] = branchName;
  await figma.clientStorage.setAsync('fileBranches', JSON.stringify(branches));
}
```

### File Content Encoding

All file contents committed to GitHub or GitLab are base64-encoded via `toBase64(str)` from `string.utils.ts`:

```typescript
// packages/figma/src/utils/string.utils.ts
export const toBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};
```

## Network Access

`manifest.json` sets `networkAccess.allowedDomains: ["*"]` (wildcard). This is intentional and required — self-hosted GitLab instances can be any domain, so a whitelist of specific domains is not feasible. The `reasoning` field in `manifest.json` documents this.

## Open Questions

- [ ] Document whether `filePath` is relative to repo root or needs to be absolute (current behavior: treated as relative)
- [ ] `authToken` in `clientStorage` (`fileTokens`) vs `authToken` in a loaded `GitProviderConfig` (from `setPluginData`) — these are **separate** storage slots; the config's `authToken` may be stale if overwritten by `saveToken()`
- [ ] Document GitLab self-hosted testing approach (no test fixture currently exists)
- [ ] Clarify what `GitProviderConfig.authToken` is used for vs. the `getToken()` call path — some call sites may send one but not the other
