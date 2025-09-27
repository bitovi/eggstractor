#!/usr/bin/env node
import { execSync } from 'node:child_process';

const files = process.argv.slice(2);
// Filter to files Prettier can handle (optional safety)
const printable = files.filter((f) =>
  /\.(ts|tsx|js|jsx|mts|cts|json|md|css|scss|html|yml|yaml)$/i.test(f),
);

if (printable.length === 0) process.exit(0);

// Nx wants comma-separated list
const list = printable.join(',');

// Inherit stdio so output shows in the commit log
execSync(`npx nx format:write --files="${list}"`, { stdio: 'inherit' });
