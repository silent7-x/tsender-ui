import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { http, WagmiProvider } from "wagmi";
import { anvil, base } from "wagmi/chains";

if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  throw new Error(
    "Error: VITE_WALLETCONNECT_PROJECT_ID is not defined. Please set it in your .env.local file"
  );
}

const config = getDefaultConfig({
  appName: "TSender",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [base, anvil],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_ALCHEMY_RPC_URL),
    [anvil.id]: http(import.meta.env.VITE_ANVIL_RPC_URL),
  },
  ssr: false,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Hydration safety check: ensure component mounts on client before rendering children
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* Only render children after client-side mounting */}
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
