# Skill: MaintainGitProviderConfigStorage

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend git provider config persistence without breaking the save/load contract or clientStorage key structure.

## Implementation

- File: `packages/figma/src/git-provider.ts`
- Methods:
  - `saveToken(authToken: string): Promise<void>`
  - `getToken(): Promise<string | null>`
  - `saveBranchName(branchName: string): Promise<void>`
  - `getBranchName(): Promise<string | null>`
  - `saveGitProviderConfig(config: GitProviderConfig): Promise<void>`
  - `getGitProviderConfig(): Promise<GitProviderConfig | null>`

## `GitProviderConfig` Shape

```typescript
interface GitProviderConfig {
  provider?: GitProvider; // 'github' | 'gitlab'
  repoPath: string;
  filePath: string;
  format: string;
  authToken?: string | null;
  branchName?: string | null;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
  outputMode: OutputMode;
  instanceUrl?: string | null;
}
```

## Storage Mechanism

Figma `clientStorage` API — persists data in Figma's local storage associated with the plugin. Survives plugin restarts but is local to the machine/Figma installation.

## Key Behaviors

- Auth token stored separately from config (separate `clientStorage` key) for security isolation
- `getGitProviderConfig()` returns `null` if no config has been saved yet
- Config is loaded on plugin startup via `'load-config'` message and sent to UI as `'config-loaded'`
- Config is saved on every UI state change via `'save-config'` message (auto-sync contract)

## TODO

- [ ] Document exact `clientStorage` key names for token, config, and branch name
- [ ] Document whether `authToken` in `GitProviderConfig` and the separately stored token are kept in sync
- [ ] Document what `getGitProviderConfig()` returns when stored data is corrupted/partial
- [ ] Document whether `clientStorage` is scoped per-document or per-plugin globally
