import { createContext, use } from "react"

export type Theme = "dark" | "light" | "system"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: string
  setAccentColor: (color: string) => void
  decoTheme: string
  setDecoTheme: (value: string) => void
}

// Keep the context shared when Vite reloads the provider component.
export const ThemeContext = createContext<ThemeState | undefined>(undefined)

export function useTheme() {
  const context = use(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
