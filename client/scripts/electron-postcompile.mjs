// Renames compiled Electron entries to .cjs — the repo root is "type": "module",
// but Electron main/preload (sandboxed) must load as CommonJS.
import { renameSync, existsSync } from "node:fs";

for (const name of ["main", "preload"]) {
  const from = new URL(`../electron/dist/${name}.js`, import.meta.url);
  const to = new URL(`../electron/dist/${name}.cjs`, import.meta.url);
  if (existsSync(from)) renameSync(from, to);
}
console.log("[electron] compiled entries renamed to .cjs");
