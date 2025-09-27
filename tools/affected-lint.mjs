#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';

// 1) Figure out git root (works even if hook runs from subdir)
const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' })
  .trim();

// 2) Get files from lint-staged argv, normalize to repo-relative, POSIX style
const files = process.argv.slice(2)
  .map((f) => path.isAbsolute(f) ? path.relative(gitRoot, f) : f)
  .map((f) => f.split(path.sep).join('/')); // posix separators

// 3) Keep only code files that should influence "lint" targets
const code = Array.from(new Set(
  files.filter((f) => /\.(ts|tsx|js|jsx|mts|cts)$/i.test(f))
));

if (!code.length) process.exit(0);

// 4) Nx expects a comma-separated list
const list = code.join(',');

// 5) Run Nx affected lint
execSync(`npx nx affected -t lint --files="${list}"`, { stdio: 'inherit' });
