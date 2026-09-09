# Git Diff Line Viz

Status-bar item showing the line diff between a target branch and the current branch.

```
$(git-compare) main +120 -45
```

- Compares against the **merge-base** of the target branch and `HEAD` (three-dot / PR-style diff).
- Two colour-coded items: `+insertions` (green) and `-deletions` (red).
- Click either to pick the target branch (saved to workspace settings).
- Refreshes on file save, branch switch (`.git/HEAD` / `index`), and config change; 300 ms debounce.

## Settings

| Setting                             | Default | Meaning                                                                                       |
| ----------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `gitDiffLineViz.targetBranch`       | `""`    | Branch to compare against. Empty = repo default branch (`origin/HEAD`, else `main`/`master`). |
| `gitDiffLineViz.includeWorkingTree` | `true`  | Count uncommitted (staged + unstaged) changes too.                                            |

## Develop

```sh
bun install          # also installs the lefthook pre-push hook
bun test             # fast unit tests (test/)
bun run test:e2e     # integration tests against a throwaway git repo (e2e/)
bun run lint         # oxlint
bun run fmt          # oxfmt --write
bun run typecheck    # tsc --noEmit
bun run build        # -> out/extension.js
```

`git push` runs `lint`, `fmt:check`, `typecheck`, and `test:e2e` via lefthook (`pre-push`).

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host.
The built `out/extension.js` runs on VS Code's Node runtime; Bun is only the
package manager / bundler / test runner.
