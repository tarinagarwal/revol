import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { ToastHost } from "@/components/ui";
import { UpdateManager } from "@/features/updates/UpdateManager";

// HashRouter: works identically on web, file:// (Electron) and Capacitor WebView.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppRoutes />
        <ToastHost />
        <UpdateManager />
      </HashRouter>
    </QueryClientProvider>
  );
}
