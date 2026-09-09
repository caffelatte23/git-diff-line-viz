import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseShortstat } from './shortstat';

const exec = promisify(execFile);

export async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd, windowsHide: true });
  return stdout.toString();
}

/** Insertions/deletions of the current branch vs `target`, measured from their merge-base. */
export async function gitDiffCounts(
  cwd: string,
  target: string,
  includeWorkingTree: boolean,
): Promise<{ insertions: number; deletions: number }> {
  const base = (await git(cwd, ['merge-base', target, 'HEAD'])).trim();
  const args = includeWorkingTree
    ? ['diff', '--shortstat', base]
    : ['diff', '--shortstat', base, 'HEAD'];
  const { insertions, deletions } = parseShortstat(await git(cwd, args));
  return { insertions, deletions };
}
