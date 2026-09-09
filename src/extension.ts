import * as vscode from "vscode";
import { git, gitDiffCounts, resolveTarget } from "./diff";

// Two adjacent items so insertions/deletions can carry their own colour.
let addItem: vscode.StatusBarItem;
let delItem: vscode.StatusBarItem;
let timer: ReturnType<typeof setTimeout> | undefined;

const ADDED = new vscode.ThemeColor("gitDecoration.addedResourceForeground");
const DELETED = new vscode.ThemeColor("gitDecoration.deletedResourceForeground");

export function activate(context: vscode.ExtensionContext) {
  addItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  delItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  for (const it of [addItem, delItem]) {
    it.command = "gitDiffLineViz.pickBranch";
    context.subscriptions.push(it);
  }

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
    addItem.hide();
    delItem.hide();
    return;
  }
  const cfg = vscode.workspace.getConfiguration("gitDiffLineViz");
  const includeWT = cfg.get<boolean>("includeWorkingTree", true);
  let target = cfg.get<string>("targetBranch", "");
  try {
    target = await resolveTarget(folder, target);
    const { insertions, deletions } = await gitDiffCounts(folder, target, includeWT);
    addItem.text = `$(git-compare) ${target} +${insertions}`;
    addItem.color = ADDED;
    delItem.text = `-${deletions}`;
    delItem.color = DELETED;
    const tip =
      `Diff vs ${target} (merge-base)\n` +
      `+${insertions} insertions, -${deletions} deletions` +
      (includeWT ? "\nincluding working tree" : "") +
      "\nClick to change target branch";
    addItem.tooltip = tip;
    delItem.tooltip = tip;
    addItem.show();
    delItem.show();
  } catch (e) {
    addItem.text = `$(git-compare) ${target || "?"} —`;
    addItem.color = undefined;
    addItem.tooltip = `git-diff-line-viz: ${message(e)}`;
    addItem.show();
    delItem.hide();
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
