# CLAUDE.md

VS Code extension: a status-bar item showing the `+insertions / -deletions` of the
current branch versus a target branch (measured from their merge-base).

## Layout

| Path                 | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `src/extension.ts`   | Activation, the two status-bar items, refresh triggers, `pickBranch` command |
| `src/diff.ts`        | `git` exec helper, `resolveTarget`, `gitDiffCounts` — no `vscode` import     |
| `src/shortstat.ts`   | Pure parser for `git diff --shortstat` output                                |
| `test/`              | Fast unit tests (`bun test ./test`) — no git, no vscode                      |
| `e2e/`               | Integration tests against a throwaway git repo (`bun test ./e2e`)            |
| `.github/workflows/` | `ci.yml` (push/PR checks), `release.yml` (tag → Marketplace)                 |
| `logo.svg`           | Icon source; `bun run icon:png` rasterises it to `images/icon.png` (128²)    |

Runtime deps: none. Bun is the package manager / bundler / test runner only.
The shipped `out/extension.js` runs on VS Code's Node host (CJS, `vscode` external).

## Commands

```sh
bun install          # deps + installs the lefthook pre-push hook
bun run build        # bundle -> out/extension.js
bun run watch        # rebuild on change
bun test             # unit tests (test/)
bun run test:e2e     # e2e tests (e2e/) — needs `git` on PATH
bun run lint         # oxlint
bun run fmt          # oxfmt --write   (fmt:check for CI)
bun run typecheck    # tsc --noEmit
bun run package      # build a .vsix locally (vsce package --no-dependencies)
```

`git push` runs `lint`, `fmt:check`, `typecheck`, `test:e2e` via lefthook
(`lefthook.yml`, `pre-push`). CI runs the same set plus `build` on every push/PR.

## Architecture notes

- **Refresh triggers** (`schedule()` in `extension.ts`, 300 ms debounce): file save,
  `.git/HEAD` / `.git/index` change (branch switch, external commit), config change,
  workspace-folder change. Deliberately _no_ window-focus trigger.
- **Target**: `gitDiffLineViz.targetBranch` — a branch name, or `"HEAD"` (default,
  and the fallback for an empty value) to compare against the current branch tip,
  i.e. show only uncommitted work.
- **Status bar**: one `StatusBarItem`, default colour, compact like the built-in
  branch/sync indicator: `$(git-compare) main +120 -45`. Deliberately no colours —
  status-bar text has no font-weight/bold, and `backgroundColor` accepts only
  `statusBarItem.warning/errorBackground` (which then overrides `color`).
- **Icon**: `package.json` `icon` must be a **PNG** ≥128² — the Marketplace forbids
  SVG icons, and `vsce` refuses to publish a package that contains any user SVG, so
  `.vscodeignore` excludes `**/*.svg` and only `images/icon.png` ships.
- **Config**: `tsconfig.json` is typecheck/editor only (`noEmit`, `module: node16`).
  The editor needs the workspace TypeScript (`.vscode/settings.json` →
  `js/ts.tsdk.path`); "Restart TS Server" after changing `tsconfig.json`.

## Release

`.github/workflows/release.yml` runs when a `v*` tag is pushed. The `marketplace`
job checks the tag matches `package.json` `version`, runs the checks, builds,
`bunx @vscode/vsce package`, logs in to Entra ID with a GitHub OIDC token
(`azure/login`, no stored secret), `bunx @vscode/vsce publish --azure-credential`,
and creates a GitHub Release whose notes are the matching `## [x.y.z]` section of
`CHANGELOG.md` (falling back to auto-generated notes), with the `.vsix` attached.
An opt-in `open-vsx` job publishes to Open VSX (`bunx ovsx publish`) when the repo
variable `PUBLISH_OPEN_VSX` is `true` and secret `OVSX_PAT` is set.

`vsce` / `ovsx` are run via `bunx` (fetched per-run, pinned by name only), not
kept as devDependencies.

### One-time setup (manual, not automatable)

1. **Publisher**: create one at <https://marketplace.visualstudio.com/manage>,
   then set `"publisher"` in `package.json` (`CaffeLatte23`).
2. **Entra ID app**: register an application (<https://entra.microsoft.com> →
   App registrations). Note its **Application (client) ID** and **Directory
   (tenant) ID**.
3. **Federated credential** on that app (Certificates & secrets → Federated
   credentials → _GitHub Actions deploying Azure resources_):
   - Organization `caffelatte23`, Repository `git-diff-line-viz`
   - Entity type **Environment**, name `release`
     (subject: `repo:caffelatte23/git-diff-line-viz:environment:release`)
4. **Marketplace membership**: in publisher management, add the app's service
   principal as a member so it may publish.
5. **GitHub**: create an Environment named `release` (Settings → Environments;
   add required reviewers here if wanted) and two secrets — `AZURE_CLIENT_ID`,
   `AZURE_TENANT_ID` (repo or `release`-environment scope). No client secret.
6. Optional (Open VSX): repo variable `PUBLISH_OPEN_VSX=true` + secret `OVSX_PAT`
   (from <https://open-vsx.org> → user settings → access tokens).

PAT fallback: `vsce publish -p <PAT>` (or `VSCE_PAT` env) still works if you'd
rather skip the federated setup — swap the `azure/login` + `--azure-credential`
steps for a `VSCE_PAT` secret.

### Cutting a release

```sh
npm version patch --no-git-tag-version     # or edit package.json "version"
V="v$(node -p "require('./package.json').version")"
# add a `## [<version>]` section at the top of CHANGELOG.md, then:
git commit -am "Release $V"
git tag "$V"
git push && git push --tags
```

Pushing the `v*` tag triggers `release.yml`. If the tag and `package.json`
version disagree, the workflow fails before publishing. The `## [<version>]`
section of `CHANGELOG.md` becomes the GitHub Release notes and the Marketplace
"Changelog" tab.

### Local dry run

```sh
bun run package        # produces git-diff-line-viz-<version>.vsix
```
