// Launches Electron with a clean environment.
// VS Code (and other Electron-hosted shells) export ELECTRON_RUN_AS_NODE=1,
// which silently turns Electron into plain Node and breaks the app.
import { spawn } from "node:child_process";

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn("npx", ["electron", "."], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
