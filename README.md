# Git Diff Line Viz

Status-bar item showing the line diff of the current branch against a target.

```
$(git-compare) HEAD +120 -45
```

- Compares against the **merge-base** of the target and `HEAD` (three-dot / PR-style diff).
- One compact item, like the built-in branch/sync indicator.
- Click it to pick the target branch (saved to workspace settings).
- Refreshes on file save, branch switch (`.git/HEAD` / `index`), and config change; 300 ms debounce.

## Settings

| Setting                             | Default  | Meaning                                                                                                    |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `gitDiffLineViz.targetBranch`       | `"HEAD"` | A branch name (e.g. `main`), or `HEAD` for the current branch tip (only uncommitted work). Empty = `HEAD`. |
| `gitDiffLineViz.includeWorkingTree` | `true`   | Count uncommitted (staged + unstaged) changes too.                                                         |

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
