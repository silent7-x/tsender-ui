import { App } from "@/App.tsx";
import { ThemeProvider } from "@/components/Theme-Provider";
import { Toaster } from "@/components/ui/sonner";
import "@/index.css";
import { Web3Provider } from "@/provider.tsx";
import "@rainbow-me/rainbowkit/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Provider>
      <ThemeProvider>
        <App />
        <Toaster closeButton={true} />
      </ThemeProvider>
    </Web3Provider>
  </StrictMode>
);
