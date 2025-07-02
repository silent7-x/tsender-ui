import { App } from "@/App.tsx";
import { ThemeProvider } from "@/components/Theme-Provider";
import { Toaster } from "@/components/ui/sonner";
import "@/index.css";
import { Web3Provider } from "@/provider.tsx";
import "@rainbow-me/rainbowkit/styles.css";
import { inject } from "@vercel/analytics";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

inject();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Web3Provider>
        <App />
        <Toaster closeButton={true} duration={5000} />
      </Web3Provider>
    </ThemeProvider>
  </StrictMode>
);
