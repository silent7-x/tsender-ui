import { App } from "@/App.tsx";
import { Header } from "@/components/Header.tsx";
import { Toaster } from "@/components/ui/sonner";
import "@/index.css";
import { Web3Provider } from "@/provider.tsx";
import "@rainbow-me/rainbowkit/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Provider>
      <Header />
      <App />
      <Toaster closeButton={true} />
    </Web3Provider>
  </StrictMode>
);
