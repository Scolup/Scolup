import * as React from "react"
import { use } from "react"
import { getSetting, getSettingSync, setSetting } from "@/services/storage"
import { SHOP_ITEMS } from "@/services/shop-rules"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: string
  setAccentColor: (color: string) => void
}

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_VALUES: Theme[] = ["dark", "light", "system"]

const ACCENT_COLORS: Record<string, { primary: string; foreground: string }> = {
  yellow: { primary: "#e5af4b", foreground: "#1a1a1a" },
  red: { primary: "#dd0046", foreground: "#ffffff" },
  green: { primary: "#25b256", foreground: "#ffffff" },
  blue: { primary: "#48B7E8", foreground: "#1a1a1a" },
  // Colors sold in the shop come from the shop catalog.
  ...Object.fromEntries(
    SHOP_ITEMS.filter((item) => item.kind === "accent").map((item) => [
      item.value,
      { primary: item.color, foreground: item.foreground },
    ])
  ),
}

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined)

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false
  }

  return THEME_VALUES.includes(value as Theme)
}

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return "dark"
  }

  return "light"
}

// --background in src/index.css: white in light, oklch(0.148 0.004 228.8) in
// dark. Kept as hex for the meta tag (computed from the token).
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: "#ffffff",
  dark: "#090b0c",
}

function syncThemeColor(resolved: ResolvedTheme) {
  // The static media-based metas in index.html only follow the OS. Once the
  // app runs, the effective theme (light/dark/system) wins instead.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.remove())
  const meta = document.createElement("meta")
  meta.name = "theme-color"
  meta.content = THEME_COLORS[resolved]
  document.head.appendChild(meta)
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      !!target.closest("input, textarea, select, [contenteditable='true']"))
  )
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const cached = getSettingSync(storageKey)
    return typeof cached === "string" && isTheme(cached) ? cached : defaultTheme
  })

  React.useEffect(() => {
    getSetting(storageKey).then((stored) => {
      if (typeof stored === "string" && isTheme(stored)) {
        setThemeState(stored)
      }
    })
  }, [storageKey])

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setSetting(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey]
  )

  const [accentColor, setAccentColorState] = React.useState<string>(() => {
    const cached = getSettingSync("accent-color")
    return typeof cached === "string" ? cached : ""
  })

  React.useEffect(() => {
    getSetting("accent-color").then((stored) => {
      if (typeof stored === "string") {
        setAccentColorState(stored)
      }
    })
  }, [])

  const setAccentColor = React.useCallback((color: string) => {
    setSetting("accent-color", color)
    setAccentColorState(color)
  }, [])

  React.useLayoutEffect(() => {
    const root = document.documentElement
    const resolvedTheme = theme === "system" ? getSystemTheme() : theme
    const restoreTransitions = disableTransitionOnChange
      ? disableTransitionsTemporarily()
      : null

    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
    syncThemeColor(resolvedTheme)

    if (restoreTransitions) {
      restoreTransitions()
    }

    if (theme !== "system") {
      return undefined
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      const systemTheme = getSystemTheme()
      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
      syncThemeColor(systemTheme)
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, disableTransitionOnChange])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      setThemeState((currentTheme) => {
        const nextTheme =
          currentTheme === "dark"
            ? "light"
            : currentTheme === "light"
              ? "dark"
              : getSystemTheme() === "dark"
                ? "light"
                : "dark"

        setSetting(storageKey, nextTheme)
        return nextTheme
      })
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [storageKey])

  React.useLayoutEffect(() => {
    const root = document.documentElement

    function applyAccent() {
      if (!accentColor || !ACCENT_COLORS[accentColor]) {
        root.style.removeProperty("--primary")
        root.style.removeProperty("--primary-foreground")
        root.style.removeProperty("--accent-bg-overlay")
        return
      }

      const { primary, foreground } = ACCENT_COLORS[accentColor]
      const isDark = root.classList.contains("dark")
      const alpha = isDark ? 0.08 : 0.04

      root.style.setProperty("--primary", primary)
      root.style.setProperty("--primary-foreground", foreground)
      root.style.setProperty(
        "--accent-bg-overlay",
        `color-mix(in srgb, ${primary} ${alpha * 100}%, transparent)`
      )
    }

    applyAccent()

    const observer = new MutationObserver(applyAccent)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [accentColor])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      accentColor,
      setAccentColor,
    }),
    [theme, setTheme, accentColor, setAccentColor]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = use(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
