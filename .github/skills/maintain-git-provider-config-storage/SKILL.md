---
name: maintain-git-provider-config-storage
description: Provides an agent with the knowledge needed to safely modify, debug, or extend git provider config persistence without breaking the save/load contract or clientStorage key structure.
---

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

## Storage Mechanisms

Two separate Figma persistence APIs are used — **not** all `clientStorage`:

| Data            | Mechanism                  | Key                                                         |
| --------------- | -------------------------- | ----------------------------------------------------------- |
| Auth token      | `figma.clientStorage`      | `'fileTokens'` (JSON map: `fileId → token`)                 |
| Branch name     | `figma.clientStorage`      | `'fileBranches'` (JSON map: `fileId → branchName`)          |
| Provider config | `figma.root.setPluginData` | `'gitProviderConfig'` (JSON-serialized `GitProviderConfig`) |
| File identity   | `figma.root.getPluginData` | `'customFileId'` (generated once, stable per Figma file)    |

> **Important:** `saveGitProviderConfig` uses `figma.root.setPluginData`, **not** `clientStorage`. Token and branch use `clientStorage` so they persist across devices; config is document-scoped via plugin data.

`clientStorage` survives plugin restarts and is user-scoped (per machine/Figma installation). `setPluginData` is document-scoped and travels with the Figma file.

## Key Behaviors

- Auth token and branch name are keyed per-file via `getFileId()` (generates a stable `file_${Date.now()}_${random}` ID stored in `figma.root.getPluginData('customFileId')`)
- `getGitProviderConfig()` returns `null` if no config has been saved yet; returns `null` (with a `console.error`) if stored JSON is corrupted
- Config is loaded on plugin startup via `'load-config'` message and sent to UI as `'config-loaded'`
- Config is saved on every UI state change via `'save-config'` message (auto-sync contract — see [MaintainConfigAutoSync](./maintain-config-auto-sync.skill.md))

## TODO

- [ ] Document whether `authToken` in `GitProviderConfig` and the separately stored token (`fileTokens`) are kept in sync or diverge
- [ ] Document whether `clientStorage` is scoped per-device or shared across a Figma account
