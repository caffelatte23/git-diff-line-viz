# CLAUDE.md

VS Code extension: a status-bar item showing the `+insertions / -deletions` of the
current branch versus a target (measured from their merge-base).

Commands, dev workflow and the release process live in [CONTRIBUTING.md](CONTRIBUTING.md).

## Layout

| Path                 | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `src/extension.ts`   | Activation, the status-bar item, refresh triggers, `pickBranch` |
| `src/diff.ts`        | `git` exec helper, `gitDiffCounts` — no `vscode` import         |
| `src/shortstat.ts`   | Pure parser for `git diff --shortstat` output                   |
| `test/`              | Unit tests (`bun test ./test`) — no git, no vscode              |
| `e2e/`               | Tests against a throwaway git repo (`bun test ./e2e`)           |
| `.github/workflows/` | `ci.yml` (push/PR checks), `release.yml` (tag → Marketplace)    |
| `logo.svg`           | Icon source; `bun run icon:png` → `images/icon.png`             |

## Architecture notes

- **Refresh triggers** (`schedule()` in `extension.ts`, 300 ms debounce): file save,
  `.git/HEAD` / `.git/index` change (branch switch, external commit), config change,
  workspace-folder change. Deliberately _no_ window-focus trigger.
- **Target**: `gitDiffLineViz.targetBranch` — a branch name, or `"HEAD"` (default,
  and the fallback for an empty value) to compare against the current branch tip,
  i.e. show only uncommitted work.
- **Status bar**: one `StatusBarItem`, default colour. Deliberately no colours —
  status-bar text has no font-weight/bold, and `backgroundColor` accepts only
  `statusBarItem.warning/errorBackground` (which then overrides `color`).
- **Icon**: `package.json` `icon` must be a **PNG** ≥128² — the Marketplace forbids
  SVG icons and `vsce` refuses to publish a package containing any user SVG, so
  `.vscodeignore` excludes `**/*.svg` and only `images/icon.png` ships.
- **Config**: `tsconfig.json` is typecheck/editor only (`noEmit`, `module: node16`).
  The editor needs the workspace TypeScript (`.vscode/settings.json` →
  `js/ts.tsdk.path`); "Restart TS Server" after changing `tsconfig.json`.
