import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseShortstat } from "./shortstat";

const exec = promisify(execFile);

export async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await exec("git", args, { cwd, windowsHide: true });
  return stdout.toString();
}

async function tryGit(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    return (await git(cwd, args)).trim();
  } catch {
    return undefined;
  }
}

/**
 * Resolve the branch to compare against. A non-empty `configured` value wins;
 * otherwise fall back to the repository's default branch (origin/HEAD), then
 * to a local `main`/`master`.
 */
export async function resolveTarget(cwd: string, configured: string): Promise<string> {
  const c = configured.trim();
  if (c) return c;

  const originHead = await tryGit(cwd, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  if (originHead) return originHead.replace(/^origin\//, "");

  for (const b of ["main", "master"]) {
    if (await tryGit(cwd, ["rev-parse", "--verify", "--quiet", b])) return b;
  }
  return "main";
}

/** Insertions/deletions of the current branch vs `target`, measured from their merge-base. */
export async function gitDiffCounts(
  cwd: string,
  target: string,
  includeWorkingTree: boolean,
): Promise<{ insertions: number; deletions: number }> {
  const base = (await git(cwd, ["merge-base", target, "HEAD"])).trim();
  const args = includeWorkingTree
    ? ["diff", "--shortstat", base]
    : ["diff", "--shortstat", base, "HEAD"];
  const { insertions, deletions } = parseShortstat(await git(cwd, args));
  return { insertions, deletions };
}
