import "@rainbow-me/rainbowkit/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import Header from "./components/Header.tsx";
import "./index.css";
import { Web3Provider } from "./provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Provider>
      <Header />
      <App />
    </Web3Provider>
  </StrictMode>
);
