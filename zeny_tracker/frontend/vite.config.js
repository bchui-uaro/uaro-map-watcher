import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: "src/renderer.jsx",
      formats: ["es"],
      fileName: () => "renderer.js",
      cssFileName: "renderer",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
