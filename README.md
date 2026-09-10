<p align="center">
  <img src="https://raw.githubusercontent.com/caffelatte23/git-diff-line-viz/HEAD/images/icon.png" width="128" height="128" alt="Git Diff Line Viz logo">
</p>

# Git Diff Line Viz

A single status-bar item showing how many lines the current branch adds and
removes compared to a target — like the built-in branch/sync indicator, but for
line counts.

```
⎇ HEAD +120 -45
```

By default it compares against `HEAD`, so the numbers are just your uncommitted
work. Set a branch name (e.g. `main`) and it shows how far the current branch has
diverged, measured from where the two branches last met (the merge-base — the
same "…" diff GitHub shows on a pull request).

## Usage

- The item appears on the left of the status bar whenever the workspace is a git
  repository.
- **Click it** to pick the branch to compare against. Your choice is saved to the
  workspace settings.
- It updates on save, when you switch branches, and when you change the settings.
- Hover for the full breakdown.

## Settings

| Setting                             | Default | Description                                                                                                                                                         |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitDiffLineViz.targetBranch`       | `HEAD`  | Branch name to compare against, or `HEAD` for the current branch tip (uncommitted work only). Empty is treated as `HEAD`. Also set by clicking the status-bar item. |
| `gitDiffLineViz.includeWorkingTree` | `true`  | Include uncommitted (staged + unstaged) changes in the counts. Turn off to compare only committed history.                                                          |

## Requirements

`git` must be on your `PATH`. Only the first workspace folder is tracked.

## Release notes

See the [Changelog](CHANGELOG.md).

## License

[MIT](LICENSE)
