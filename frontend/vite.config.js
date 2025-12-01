import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen trên tất cả IP (localhost, 127.0.0.1, LAN IP)
    port: 5174, // Port 5174
    strictPort: false, // Cho phép fallback sang port khác nếu 5174 bận
  },
  preview: {
    host: "0.0.0.0", // Preview cũng listen trên tất cả IP
    port: 5174,
    strictPort: false,
  },
  build: {
    // Optimize cho production
    target: "es2015",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`, 
        assetFileNames: `assets/[name].[hash].[ext]`,
        manualChunks: {
          vendor: ["react", "react-dom"],
          socket: ["socket.io-client"],
          utils: ["zustand", "react-hot-toast"],
        },
      },
    },
  },
});
