import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, type Plugin } from 'vite'
import { fumadocsMdx } from 'fumadocs-mdx/vite'

/**
 * Fumadocs MDX for the Docs. Its "project root" must be the monorepo root, because the
 * content lives in packages/docs (it refuses files outside its root). Vite's own root
 * stays apps/desktop; only Fumadocs is told about the repo root.
 */
function docsMdx(): Plugin[] {
  const repoRoot = path.resolve(__dirname, "../..")
  return fumadocsMdx({ macro: { include: ['**/packages/docs/src/**/*.ts'] }, index: false }).map((plugin) => {
    const config = plugin.config
    if (typeof config !== "function") return plugin
    return { ...plugin, config: (userConfig, env) => config.call(undefined as never, { ...userConfig, root: repoRoot }, env) }
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Docs: compiles packages/docs/content (MDX) through the defineDocs macro in packages/docs.
    docsMdx(),
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
