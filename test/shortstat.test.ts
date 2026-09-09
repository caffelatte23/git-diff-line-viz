import { expect, test } from "bun:test";
import { parseShortstat } from "../src/shortstat";

test("full shortstat", () => {
  expect(parseShortstat(" 3 files changed, 12 insertions(+), 4 deletions(-)")).toEqual({
    files: 3,
    insertions: 12,
    deletions: 4,
  });
});

test("singular, insertions only", () => {
  expect(parseShortstat(" 1 file changed, 1 insertion(+)")).toEqual({
    files: 1,
    insertions: 1,
    deletions: 0,
  });
});

test("deletions only", () => {
  expect(parseShortstat(" 2 files changed, 5 deletions(-)")).toEqual({
    files: 2,
    insertions: 0,
    deletions: 5,
  });
});

test("no changes", () => {
  expect(parseShortstat("")).toEqual({ files: 0, insertions: 0, deletions: 0 });
});
