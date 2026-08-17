import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: "../",
  // sockjs-client(채팅 웹소켓)가 Node의 global을 참조해서 브라우저에서 "global is not defined" 에러가 남
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
    open: true,
  },
});
