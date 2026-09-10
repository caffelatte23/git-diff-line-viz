import * as vscode from "vscode";
import { git, gitDiffCounts } from "./diff";

// One item, default colour, like the built-in branch/sync indicator.
let item: vscode.StatusBarItem;
let timer: ReturnType<typeof setTimeout> | undefined;

export function activate(context: vscode.ExtensionContext) {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = "gitDiffLineViz.pickBranch";
  context.subscriptions.push(item);

  context.subscriptions.push(
    vscode.commands.registerCommand("gitDiffLineViz.pickBranch", pickBranch),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("gitDiffLineViz")) schedule();
    }),
    vscode.workspace.onDidSaveTextDocument(() => schedule()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => schedule()),
  );

  const folder = wsFolder();
  if (folder) {
    // Catches branch switches (checkout/rebase) and commits made outside the editor.
    // ponytail: assumes workspace folder == repo root.
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folder, ".git/{HEAD,index}"),
    );
    watcher.onDidChange(schedule);
    watcher.onDidCreate(schedule);
    context.subscriptions.push(watcher);
  }

  void refresh();
}

export function deactivate() {
  if (timer) clearTimeout(timer);
}

function wsFolder(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

// Debounced refresh: coalesces bursts (e.g. "Save All", a rebase touching many refs)
// into a single `git` invocation.
function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void refresh(), 300);
}

async function refresh() {
  const folder = wsFolder();
  if (!folder) {
    item.hide();
    return;
  }
  const cfg = vscode.workspace.getConfiguration("gitDiffLineViz");
  const includeWT = cfg.get<boolean>("includeWorkingTree", true);
  const target = cfg.get<string>("targetBranch", "").trim() || "HEAD";
  try {
    const { insertions, deletions } = await gitDiffCounts(folder, target, includeWT);
    // Compact, like the built-in sync indicator: `main +120 -45`.
    item.text = `$(git-compare) ${target} +${insertions} -${deletions}`;
    item.tooltip =
      `Diff vs ${target} (merge-base)\n` +
      `+${insertions} insertions, -${deletions} deletions` +
      (includeWT ? "\nincluding working tree" : "") +
      "\nClick to change target branch";
    item.show();
  } catch (e) {
    item.text = `$(git-compare) ${target || "?"} —`;
    item.tooltip = `git-diff-line-viz: ${message(e)}`;
    item.show();
  }
}

async function pickBranch() {
  const folder = wsFolder();
  if (!folder) return;
  let branches: string[];
  try {
    const out = await git(folder, [
      "for-each-ref",
      "--format=%(refname:short)",
      "refs/heads",
      "refs/remotes",
    ]);
    branches = out
      .split("\n")
      .map((s) => s.trim())
      .filter((b) => b && !b.endsWith("/HEAD"));
  } catch (e) {
    vscode.window.showErrorMessage(`git-diff-line-viz: ${message(e)}`);
    return;
  }
  const pick = await vscode.window.showQuickPick(branches, {
    placeHolder: "Select target branch to compare against",
  });
  if (!pick) return;
  await vscode.workspace
    .getConfiguration("gitDiffLineViz")
    .update("targetBranch", pick, vscode.ConfigurationTarget.Workspace);
  void refresh();
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
