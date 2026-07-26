/** Injected by the Electron preload bridge — absent on web/mobile. */
interface RevolDesktopApi {
  isDesktop: true;
  getVersion: () => Promise<string>;
  update: {
    check: () => Promise<{ dev: boolean }>;
    download: () => Promise<void>;
    install: () => Promise<void>;
    onAvailable: (cb: (info: { version: string }) => void) => void;
    onProgress: (cb: (p: { percent: number }) => void) => void;
    onReady: (cb: () => void) => void;
    onError: (cb: (e: { message: string }) => void) => void;
  };
}

interface Window {
  revolDesktop?: RevolDesktopApi;
}

/** Injected at build time by Vite define. */
declare const __APP_VERSION__: string;
