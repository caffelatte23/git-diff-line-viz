import { afterAll, beforeAll, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitDiffCounts } from '../src/diff';

let hasGit = true;
try {
  execFileSync('git', ['--version'], { stdio: 'ignore' });
} catch {
  hasGit = false;
}

// ponytail: one shared repo, tests run in file order and clean up after themselves.
// Split into per-test repos only if they start interfering.
let repo: string;

const g = (args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
const write = (name: string, lines: number) =>
  writeFileSync(join(repo, name), Array.from({ length: lines }, (_, i) => `line ${i}`).join('\n') + '\n');

beforeAll(() => {
  if (!hasGit) return;
  repo = mkdtempSync(join(tmpdir(), 'gdlv-e2e-'));
  g(['init', '-q', '-b', 'main']);
  g(['config', 'user.email', 't@example.com']);
  g(['config', 'user.name', 'test']);
  write('a.txt', 5);
  g(['add', '-A']);
  g(['commit', '-qm', 'base']);
  g(['checkout', '-qb', 'feature']);
  write('a.txt', 8); // +3 vs base (lines 0-4 kept, 5-7 added)
  write('b.txt', 4); // +4 new file
  g(['add', '-A']);
  g(['commit', '-qm', 'feature work']);
});

afterAll(() => {
  if (repo) rmSync(repo, { recursive: true, force: true });
});

test.skipIf(!hasGit)('committed insertions vs merge-base', async () => {
  expect(await gitDiffCounts(repo, 'main', false)).toEqual({ insertions: 7, deletions: 0 });
});

test.skipIf(!hasGit)('includeWorkingTree adds uncommitted changes', async () => {
  write('b.txt', 6); // 4 -> 6 : +2 unstaged
  try {
    expect(await gitDiffCounts(repo, 'main', false)).toEqual({ insertions: 7, deletions: 0 });
    expect(await gitDiffCounts(repo, 'main', true)).toEqual({ insertions: 9, deletions: 0 });
  } finally {
    write('b.txt', 4); // restore
  }
});

test.skipIf(!hasGit)('counts deletions', async () => {
  g(['checkout', '-qb', 'shrink', 'feature']);
  try {
    write('a.txt', 2); // vs base (5 lines): -3
    g(['add', '-A']);
    g(['commit', '-qm', 'shrink']);
    expect(await gitDiffCounts(repo, 'main', false)).toEqual({ insertions: 4, deletions: 3 });
  } finally {
    g(['checkout', '-qf', 'feature']);
  }
});
