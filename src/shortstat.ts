/** Parse the output of `git diff --shortstat`. */
export function parseShortstat(s: string): {
  files: number;
  insertions: number;
  deletions: number;
} {
  const files = /(\d+) files? changed/.exec(s)?.[1];
  const ins = /(\d+) insertions?\(\+\)/.exec(s)?.[1];
  const del = /(\d+) deletions?\(-\)/.exec(s)?.[1];
  return {
    files: files ? Number(files) : 0,
    insertions: ins ? Number(ins) : 0,
    deletions: del ? Number(del) : 0,
  };
}
