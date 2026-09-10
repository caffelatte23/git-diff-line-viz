# Contributing

## Setup

```sh
bun install   # deps + installs the lefthook pre-push hook
```

Runtime deps: none. Bun is the package manager / bundler / test runner only. The
shipped `out/extension.js` runs on VS Code's Node host (CJS, `vscode` external).

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host.

## Commands

```sh
bun run build        # bundle -> out/extension.js
bun run watch        # rebuild on change
bun test             # unit tests (test/) — no git, no vscode
bun run test:e2e     # e2e tests (e2e/) — builds a throwaway git repo; needs `git` on PATH
bun run lint         # oxlint
bun run fmt          # oxfmt --write   (fmt:check is the CI/pre-push variant)
bun run typecheck    # tsc --noEmit
bun run package      # build a .vsix locally
bun run icon:png     # rasterise logo.svg -> images/icon.png (128x128)
```

`git push` runs `lint`, `fmt:check`, `typecheck`, `test:e2e` via lefthook
(`lefthook.yml`, `pre-push`). CI (`.github/workflows/ci.yml`) runs the same set
plus `build` on every push / PR.

## Release

`.github/workflows/release.yml` runs when a `v*` tag is pushed. The `marketplace`
job checks the tag matches `package.json` `version`, runs the checks, builds,
`bunx @vscode/vsce package`, `bunx @vscode/vsce publish` (auth via the `VSCE_PAT`
secret, retried a few times because the gallery API stalls), and creates a GitHub
Release whose notes are the matching `## [x.y.z]` section of `CHANGELOG.md`
(falling back to auto-generated notes), with the `.vsix` attached. An opt-in
`open-vsx` job publishes to Open VSX (`bunx ovsx publish`) when the repo variable
`PUBLISH_OPEN_VSX` is `true` and secret `OVSX_PAT` is set.

`vsce` / `ovsx` run via `bunx` (fetched per-run, pinned by name only), not kept as
devDependencies.

### One-time setup (manual, not automatable)

1. **Publisher**: create one at <https://marketplace.visualstudio.com/manage>,
   then set `"publisher"` in `package.json` to its **ID** (`CaffeLatte23`).
2. **PAT**: at <https://dev.azure.com> → User settings → Personal access tokens →
   New, scope **Marketplace → Manage**, all organisations. The token's account
   must own / be a member of the publisher. (An Entra service principal with
   `--azure-credential` also works but was fiddlier to authorise, so this project
   uses a PAT.)
3. **GitHub**: add the token as the `VSCE_PAT` secret (repo, or the `release`
   environment). Optionally create a `release` Environment with required
   reviewers.
4. Optional (Open VSX): repo variable `PUBLISH_OPEN_VSX=true` + secret `OVSX_PAT`
   (<https://open-vsx.org> → user settings → access tokens).

The very first publish of a new extension tends to time out on the gallery API
even with the retry. If it won't go through, do the initial upload by hand —
`bun run package`, then <https://marketplace.visualstudio.com/manage> → the
extension → upload the `.vsix`. Subsequent tag releases go through CI as updates.

### Cutting a release

```sh
npm version patch --no-git-tag-version     # or edit package.json "version"
V="v$(node -p "require('./package.json').version")"
# add a `## [<version>]` section at the top of CHANGELOG.md, then:
git commit -am "Release $V"
git tag "$V"
git push && git push --tags
```

If the tag and `package.json` version disagree, the workflow fails before
publishing.
