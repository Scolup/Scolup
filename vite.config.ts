import path from "path"
import { execSync } from "node:child_process"
import { createRequire } from "node:module"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

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
  plugins: [react(), tailwindcss()],
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
