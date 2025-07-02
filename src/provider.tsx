import { ThemeProviderContext } from "@/components/Theme-Provider";
import { config } from "@/lib/config";
import {
  darkTheme,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";

if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  throw new Error(
    "Error: VITE_WALLETCONNECT_PROJECT_ID is not defined. Please set it in your .env.local file"
  );
}

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Hydration safety check: ensure component mounts on client before rendering children
  const [mounted, setMounted] = useState(false);
  const { theme } = useContext(ThemeProviderContext);

  let resolvedTheme = theme;
  if (theme === "system") {
    resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          coolMode={true}
          theme={resolvedTheme === "dark" ? darkTheme() : lightTheme()}
        >
          {/* Only render children after client-side mounting */}
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
