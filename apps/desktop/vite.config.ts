import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
     alias: {
       "@": path.resolve(__dirname, "./src"),
     },
   },
  // Tauri setup: keep Rust errors visible, and use a fixed port that matches
  // devUrl in src-tauri/tauri.conf.json. strictPort fails loudly instead of
  // silently moving to another port (where the window would load the wrong app).
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Cargo rebuilds Rust itself; Vite doesn't need to watch it.
    watch: { ignored: ["**/src-tauri/**"] },
  },
})
