# Git Diff Line Viz

Status-bar item showing the line diff between a target branch and the current branch.

```
$(git-compare) main +120 -45
```

- Compares against the **merge-base** of the target branch and `HEAD` (three-dot / PR-style diff).
- Click the item to pick the target branch (saved to workspace settings).
- Refreshes on save, window focus, branch switch, and config change.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `gitDiffLineViz.targetBranch` | `main` | Branch to compare against. |
| `gitDiffLineViz.includeWorkingTree` | `true` | Count uncommitted (staged + unstaged) changes too. |

## Develop

```sh
bun install          # also installs the lefthook pre-push hook
bun test             # fast unit tests (test/)
bun run test:e2e     # integration tests against a throwaway git repo (e2e/)
bun run build        # -> out/extension.js
```

`bun run test:e2e` also runs automatically on `git push` (lefthook `pre-push`).

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host.
The built `out/extension.js` runs on VS Code's Node runtime; Bun is only the
package manager / bundler / test runner.
