import path from "path"
import { execSync } from "node:child_process"
import { createRequire } from "node:module"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { version } = createRequire(import.meta.url)("./package.json") as {
  version: string
}

// The build id is the commit Scolup was built from, so a released CalVer version
// can still be told apart from the next rebuild of it.
function commitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: import.meta.dirname,
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
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 2326,
    allowedHosts: true,
  },
})
