---
applyTo: '**'
---

# Eggstractor Development Instructions

**Eggstractor** is a Figma plugin that extracts design tokens and generates CSS, SCSS, and Tailwind stylesheets with automated GitHub/GitLab PR integration.

All deep domain knowledge, scaffold patterns, and style conventions live in **agents** and **skills** under `.github/instructions/`. Start there before implementing anything.

---

## How to Use the AI Instruction System

### Agents — use these for domain-scoped work

| Agent                     | File                                                             | When to use                                           |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Figma Plugin Architecture | `.github/instructions/agents/figma-plugin-architecture.agent.md` | Main/UI thread communication, message types, storage  |
| Figma Processor           | `.github/instructions/agents/figma-processor.agent.md`           | Adding/modifying style processors                     |
| Token Collection          | `.github/instructions/agents/token-collection.agent.md`          | Token aggregation, variable resolution, multi-mode    |
| Code Generation           | `.github/instructions/agents/code-generation.agent.md`           | CSS/SCSS/Tailwind transformers, naming context        |
| UI Component              | `.github/instructions/agents/ui-component.agent.md`              | React components, routes, form structure              |
| UI State                  | `.github/instructions/agents/ui-state.agent.md`                  | Context providers, hooks, auto-sync, message handling |
| Git Provider              | `.github/instructions/agents/git-provider.agent.md`              | GitHub PR and GitLab MR workflows                     |
| Testing                   | `.github/instructions/agents/testing.agent.md`                   | Vitest processor/transformer tests, Playwright E2E    |

### Skills — use these for specific maintenance tasks

Skills are targeted instruction files in `.github/instructions/skills/`. Reference the skill file that matches your task (e.g. `maintain-background-processor.skill.md` when modifying `background.processor.ts`).

### Supporting references

- `.github/instructions/techstack.md` — full technology inventory
- `.github/instructions/style-guides/` — per-category coding style rules
- `.github/instructions/architectural-domains.json` — machine-readable domain constraints
- `.github/instructions/file-categorization.json` — maps source files to categories

## Fundamental Standards

- Write **TypeScript** for all code; strict mode is enforced across all packages.
- Refer to `.github/instructions/style-guides/` for per-category typing patterns (components, hooks, context, processors, transformers).

## Critical Constraints Not Yet Captured in Agents or Skills

The following are documented here until dedicated agents or skills are created for them.

### Plugin manifest network access

`manifest.json` declares `networkAccess.allowedDomains: ['https://api.github.com']`. **GitLab domains are not in the allowlist.** Any feature that adds a new external API host must also update `manifest.json`.

### Multi-mode (theme) CSS output

When `TokenCollection` contains a `modes` map, transformers emit:

- A `:root` block for the default mode
- `[data-theme='<name>']` blocks for each alternative mode
- Mode names normalized via `normalizeModeName()`

No dedicated skill covers this yet — see the token-collection and code-generation agents for context.

### Transformer snapshot tests

All transformers require snapshot tests. A `MaintainTransformerTests` skill does not yet exist — follow patterns in `.github/instructions/agents/testing.agent.md` and existing files under `packages/figma/src/tests/transformers/`.
