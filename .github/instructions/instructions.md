---
applyTo: '**'
---

# Eggstractor Development Instructions

**Eggstractor** is a Figma plugin that extracts design tokens and generates CSS, SCSS, and Tailwind stylesheets with automated GitHub/GitLab PR integration.

All deep domain knowledge, scaffold patterns, and style conventions live in **agents** and **skills**. Start there before implementing anything.

---

## How to Use the AI Instruction System

### Agents — select the one that matches your role today

Agents are role-based personas defined in `.github/agents/`. Select one from the agent picker in VS Code Chat. Each agent has scoped tools and sub-specializations that link to relevant skills.

| Agent                 | File                                            | Select when you are…                                                    |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Plugin Core Developer | `.github/agents/plugin-core-developer.agent.md` | Working on the Figma main thread, processors, or token collection       |
| Output Engineer       | `.github/agents/output-engineer.agent.md`       | Working on CSS/SCSS/Tailwind transformers, naming, or variant output    |
| UI Developer          | `.github/agents/ui-developer.agent.md`          | Building React components, context, hooks, or UI message handling       |
| Integration Developer | `.github/agents/integration-developer.agent.md` | Working on GitHub PR, GitLab MR, or config storage workflows            |
| Test Engineer         | `.github/agents/test-engineer.agent.md`         | Writing or maintaining tests, fixtures, or snapshots                    |
| Code Reviewer         | `.github/agents/code-reviewer.agent.md`         | Reviewing a PR or auditing a change for style and architectural fitness |

### Skills — granular how-to references

Skills live in `.github/skills/<skill-name>/SKILL.md`. Copilot loads them automatically when your task matches the skill description, or invoke them directly with `/maintain-<name>` in chat. Each agent lists which skills are relevant to its sub-specializations.

### Supporting references

- `.github/instructions/techstack.md` — full technology inventory
- `.github/instructions/style-guides/` — per-category coding style rules
- `.github/instructions/architectural-domains.json` — machine-readable domain constraints
- `.github/instructions/file-categorization.json` — maps source files to categories

## Fundamental Standards

- Write **TypeScript** for all code; strict mode is enforced across all packages.
- Refer to `.github/instructions/style-guides/` for per-category typing patterns (components, hooks, context, processors, transformers).

## Critical Constraints

### Plugin manifest network access

`manifest.json` declares `networkAccess.allowedDomains: ['https://api.github.com']`. **GitLab domains are not in the allowlist.** Any feature that adds a new external API host must also update `manifest.json`.
