import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Rutas relativas: el build funciona en GitHub Pages sea cual sea el nombre del repo.
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
