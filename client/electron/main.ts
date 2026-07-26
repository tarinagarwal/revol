import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";

/**
 * Revol desktop shell.
 * Security posture: contextIsolation on, nodeIntegration off, sandbox on —
 * the renderer is the same untrusted web app that ships everywhere else.
 */
const isDev = !app.isPackaged;

let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    void win.loadURL("http://localhost:5173");
  } else {
    void win.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  }

  win.on("closed", () => {
    win = null;
  });
}

/* ---------- Auto-update (Epic 15) ----------
 * Feed: GitHub Releases (tarinagarwal/revol). All UI is custom in the
 * renderer — main just relays events over IPC. No default dialogs.
 */
function sendUpdate(channel: string, payload?: unknown): void {
  win?.webContents.send(channel, payload);
}

let updateInteractive = false; // suppress error UI for silent startup checks

function wireAutoUpdater(): void {
  autoUpdater.autoDownload = false; // download only when the user says so
  autoUpdater.on("update-available", (info) => sendUpdate("update:available", { version: info.version }));
  autoUpdater.on("update-not-available", () => sendUpdate("update:none"));
  autoUpdater.on("download-progress", (p) => sendUpdate("update:progress", { percent: p.percent }));
  autoUpdater.on("update-downloaded", () => sendUpdate("update:ready"));
  autoUpdater.on("error", (err) => {
    if (updateInteractive) sendUpdate("update:error", { message: err.message });
  });

  ipcMain.handle("update:check", async () => {
    if (isDev) return { dev: true };
    updateInteractive = true;
    await autoUpdater.checkForUpdates();
    return { dev: false };
  });
  ipcMain.handle("update:download", async () => {
    updateInteractive = true;
    await autoUpdater.downloadUpdate();
  });
  ipcMain.handle("update:install", () => {
    autoUpdater.quitAndInstall();
  });
  ipcMain.handle("app:version", () => app.getVersion());
}

app.whenReady().then(() => {
  wireAutoUpdater();
  createWindow();

  if (!isDev) {
    // Quiet startup check — renderer shows custom UI if something's found.
    void autoUpdater.checkForUpdates().catch(() => undefined);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
