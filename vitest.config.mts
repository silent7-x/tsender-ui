import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "**/test/**",
      "playwright-report/**",
      "test-results/**",
    ],
    server: {
      deps: {
        inline: ["wagmi", "@wagmi/core"],
      },
    },
  },
});
