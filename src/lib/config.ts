import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import {
  anvil,
  apeChain,
  arbitrum,
  base,
  mainnet,
  optimism,
} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "TSender",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, base, arbitrum, optimism, anvil, apeChain],

  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_ALCHEMY_RPC_URL),
    [anvil.id]: http(import.meta.env.VITE_ANVIL_RPC_URL),
    [arbitrum.id]: http(import.meta.env.VITE_ARBITRUM_ALCHEMY_RPC_URL),
    [optimism.id]: http(import.meta.env.VITE_OPTIMISM_ALCHEMY_RPC_URL),
    [mainnet.id]: http(import.meta.env.VITE_MAINNET_ALCHEMY_RPC_URL),
  },
  ssr: false,
});
