import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: "../",
  define: {
    global: "globalThis",
  },
  plugins: [
    react({
      include: "**/*.{jsx,js,tsx,ts}",
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});
