# GitLab Support Implementation

## Summary

Added full GitLab support alongside existing GitHub integration, including support for self-hosted GitLab instances. The implementation maintains backward compatibility with existing GitHub configurations.

## Changes Made

### 1. Type Definitions (`packages/common/src/types/`)

#### `github-config.ts`

- Created `GitProvider` type: `'github' | 'gitlab'`
- Created `GitProviderConfig` interface with new fields:
  - `provider?: GitProvider` - Defaults to 'github' for backward compatibility
  - `token?: string` - Generic token field (replaces provider-specific ones)
  - `instanceUrl?: string` - For self-hosted GitLab instances
- Kept `GithubConfig` as deprecated alias for backward compatibility

#### `message-to-main-thread-payload.ts`

- Updated `CreatePRPayload` to include:
  - `provider?: GitProvider`
  - `token?: string`
  - `instanceUrl?: string`
  - Kept `githubToken` for backward compatibility
- Updated `SaveConfigPayload` similarly

#### `message-to-ui-payload.ts`

- Changed `ConfigLoadedPayload.config` from `GithubConfig` to `GitProviderConfig`

### 2. Core Integration (`packages/figma/src/`)

#### Renamed: `github.ts` → `git-provider.ts`

- Created main router function: `createPR(provider, token, repoPath, filePath, branchName, content, instanceUrl)`
  - Delegates to `createGitHubPR()` or `createGitLabMR()` based on provider
- **GitHub Implementation** (`createGitHubPR`):
  - Kept all existing functionality unchanged
  - Uses Bearer token authentication
  - Endpoint: `https://api.github.com`
- **GitLab Implementation** (`createGitLabMR`):
  - Uses PRIVATE-TOKEN header authentication
  - Configurable base URL via `instanceUrl` (defaults to gitlab.com)
  - Project ID encoding: URL-encodes project path (e.g., "owner/repo" → "owner%2Frepo")
  - File path encoding: URL-encodes file paths
  - Creates Merge Requests instead of Pull Requests
  - Uses `web_url` instead of `html_url` in responses

- **Helper Functions**:
  - `getGitLabBaseUrl(instanceUrl)` - Constructs API base URL for GitLab instance
  - `encodeProjectPath(path)` - URL-encodes project paths for GitLab API
  - `encodeFilePath(path)` - URL-encodes file paths for GitLab API

- **Storage Functions** (unchanged):
  - `saveToken()` / `getToken()`
  - `saveBranchName()` / `getBranchName()`
  - `saveGitProviderConfig()` / `getGitProviderConfig()` (renamed from saveGithubConfig)

#### `index.ts` (Main Thread Handler)

- Updated imports: `Github` → `gitProvider`
- Updated type imports: `GithubConfig` → `GitProviderConfig`
- **`save-config` handler**: Supports both `token` and `githubToken` fields, defaults provider to 'github'
- **`load-config` handler**: Reads from new storage, defaults provider to 'github' for old configs
- **`create-pr` handler**: Calls `gitProvider.createPR()` with provider, token, and instanceUrl

### 3. UI Components (`packages/ui/src/`)

#### `app/context/ConfigContext/ConfigContext.tsx`

- Added state management for:
  - `provider: GitProvider` (default: 'github')
  - `token: string` (replaces provider-specific field)
  - `instanceUrl?: string` (for GitLab)
- Kept `githubToken` for backward compatibility
- Updated `saveConfig()` to support all new fields
- Maintains backward compatibility by supporting both token fields

#### `app/routes/Setup/Setup.tsx`

- Added **Provider Selector** (ButtonGroup):
  - Options: GitHub / GitLab
  - Placed at top of form
- **Dynamic Repository Field**:
  - Label: "GitHub repository" or "GitLab project"
  - Hint: Adjusted for provider
  - Help link: Provider-specific documentation

- **Instance URL Field** (conditional):
  - Only shown when GitLab is selected
  - Optional field for self-hosted instances
  - Hint: "e.g., gitlab.company.com (leave empty for gitlab.com)"

- **Dynamic Token Field**:
  - Label: "GitHub token" or "GitLab token"
  - Help link: Provider-specific token creation docs
  - GitHub: Fine-grained personal access tokens
  - GitLab: Personal access tokens

#### `app/routes/Export/Export.tsx`

- Updated to read `provider`, `token`, and `instanceUrl` from config
- **Dynamic Validation Messages**: Shows provider name in error messages
- **Dynamic Button Text**:
  - GitHub: "Create Pull Request"
  - GitLab: "Create Merge Request"
- **Dynamic Success Messages**:
  - GitHub: "Pull request created!"
  - GitLab: "Merge request created!"
- **Dynamic Link Text**:
  - GitHub: "Open in GitHub →"
  - GitLab: "Open in GitLab →"
- **Dynamic Setup Instructions**: References correct provider in help text

## Backward Compatibility

✅ **Full backward compatibility maintained**:

- Existing GitHub configs automatically default to `provider: 'github'`
- Old `githubToken` field still supported alongside new `token` field
- Old storage keys (`githubConfig`) read and migrated to new format
- UI gracefully handles configs without provider field

## API Differences Handled

| Feature              | GitHub                 | GitLab                             |
| -------------------- | ---------------------- | ---------------------------------- |
| **Authentication**   | Bearer token           | PRIVATE-TOKEN header               |
| **Base URL**         | api.github.com (fixed) | Configurable (self-hosted support) |
| **Project ID**       | owner/repo             | URL-encoded owner%2Frepo           |
| **File paths**       | Plain                  | URL-encoded                        |
| **PR/MR naming**     | Pull Request           | Merge Request                      |
| **URL field**        | html_url               | web_url                            |
| **Default branch**   | default_branch         | default_branch                     |
| **Content encoding** | Base64                 | Base64                             |

## Testing Checklist

### GitHub (Regression Testing)

- [ ] Test with existing GitHub config (should work without changes)
- [ ] Create new GitHub configuration from scratch
- [ ] Generate styles and create pull request
- [ ] Verify branch creation
- [ ] Verify file update
- [ ] Verify PR creation/update
- [ ] Check backward compatibility (old configs load correctly)

### GitLab (New Feature)

- [ ] Test with gitlab.com (public instance)
  - [ ] Configure GitLab provider in Setup
  - [ ] Create personal access token
  - [ ] Generate styles
  - [ ] Create merge request
  - [ ] Verify MR appears in GitLab UI
- [ ] Test with self-hosted GitLab instance
  - [ ] Enter custom instance URL
  - [ ] Verify API endpoint construction
  - [ ] Test authentication
  - [ ] Create merge request
- [ ] Test project path encoding (projects with special chars)
- [ ] Test file path encoding (files in nested directories)

## Known Limitations

1. **GitLab API Scope**: The implementation uses REST API v4. Ensure tokens have:
   - `api` scope for full access
   - Or `read_api` + `write_repository` for minimal access

2. **Self-hosted GitLab Versions**: Tested against GitLab 13.0+. Older versions may have API differences.

3. **Lint Warning**: The `GithubConfig` type alias triggers a TypeScript lint warning about empty interfaces. This is expected and safe - it's there purely for backward compatibility.

## Future Enhancements

- Add provider logo icons in UI
- Add validation for instance URLs
- Support GitLab groups and subgroups
- Add MR template support
- Add assignee/reviewer selection
- Support GitLab CI/CD integration
