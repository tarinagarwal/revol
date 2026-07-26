import { contextBridge, ipcRenderer } from "electron";

/**
 * The ONLY bridge between renderer and main. Narrow, typed, no raw ipcRenderer
 * exposure. Renderer accesses this as `window.revolDesktop`.
 */
const api = {
  isDesktop: true as const,

  getVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),

  update: {
    check: (interactive: boolean = true): Promise<{ dev: boolean }> =>
      ipcRenderer.invoke("update:check", interactive),
    download: (): Promise<void> => ipcRenderer.invoke("update:download"),
    install: (): Promise<void> => ipcRenderer.invoke("update:install"),
    onAvailable: (cb: (info: { version: string }) => void) => {
      ipcRenderer.on("update:available", (_e, info) => cb(info));
    },
    onProgress: (cb: (p: { percent: number }) => void) => {
      ipcRenderer.on("update:progress", (_e, p) => cb(p));
    },
    onReady: (cb: () => void) => {
      ipcRenderer.on("update:ready", () => cb());
    },
    onError: (cb: (e: { message: string }) => void) => {
      ipcRenderer.on("update:error", (_e, err) => cb(err));
    },
  },
};

contextBridge.exposeInMainWorld("revolDesktop", api);

export type RevolDesktopApi = typeof api;
