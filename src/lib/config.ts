import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { anvil, apeChain, base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "TSender",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [base, anvil, apeChain],

  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_ALCHEMY_RPC_URL),
    [anvil.id]: http(import.meta.env.VITE_ANVIL_RPC_URL),
  },
  ssr: false,
});
