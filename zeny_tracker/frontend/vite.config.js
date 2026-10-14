import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The bundle runs in Streamlit's browser context, where Node's `process` is absent.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
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
