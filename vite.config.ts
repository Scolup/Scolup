import path from "path"
import { execSync } from "node:child_process"
import { realpathSync } from "node:fs"
import { createRequire } from "node:module"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { version } = createRequire(import.meta.url)("./package.json") as {
  version: string
}
// On Windows, a terminal can open the project with different folder casing.
// Use the same on-disk path for Vite's root and source aliases.
const projectRoot = realpathSync.native(import.meta.dirname)

// The build id is the commit Scolup was built from, so a released CalVer version
// can still be told apart from the next rebuild of it.
function commitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
  } catch {
    // No git available (exported tarball, minimal docker image): build anyway.
    return "unknown"
  }
}

export default defineConfig({
  root: projectRoot,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // On enregistre le worker nous-mêmes (src/services/serviceWorker.ts),
      // pour chercher une mise à jour à chaque ouverture de l'app.
      injectRegister: false,
      // Le manifeste est écrit à la main dans public/manifest.webmanifest.
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,ico,webmanifest,woff2}"],
        // Les routes de l'app sont côté client : on sert index.html.
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // La nouvelle version prend le relais dès qu'elle est téléchargée ;
        // la page se recharge alors pour servir le cache à jour.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_BUILD__: JSON.stringify(commitHash()),
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(projectRoot, "src"),
      // Litenote's standalone build still imports Pawnote 1.6.2.
      pawnote: "@blockshub/pawnote-lts",
    },
  },
  server: {
    host: true,
    port: 2326,
    allowedHosts: true,
  },
})
