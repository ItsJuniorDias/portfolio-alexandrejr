import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react-vendor";
          if (id.includes("node_modules/three/src/")) return "three-core";
          if (id.includes("node_modules/three/")) return "three-engine";
          if (id.includes("node_modules/@react-three/fiber/")) return "fiber";
        },
      },
    },
  },
});
