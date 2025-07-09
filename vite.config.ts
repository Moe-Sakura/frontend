import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5500,
  },
  plugins: [tailwindcss()],
});
