import * as React from "react"
import { use } from "react"
import { getSetting, getSettingSync, setSetting } from "@/services/storage"
import { SETTINGS_SYNCED_EVENT } from "@/features/sync/keys"
import { SHOP_ITEMS, type AccentShopItem } from "@/features/shop/shopRules"
import { DECO_THEMES, isDecoThemeId } from "@/features/shop/decoThemes"

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
  decoTheme: string
  setDecoTheme: (value: string) => void
}

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_VALUES: Theme[] = ["dark", "light", "system"]

const ACCENT_COLORS: Record<
  string,
  { primary: string; foreground: string; image?: string }
> = {
  yellow: { primary: "#e5af4b", foreground: "#1a1a1a" },
  red: { primary: "#dd0046", foreground: "#ffffff" },
  green: { primary: "#25b256", foreground: "#ffffff" },
  blue: { primary: "#48B7E8", foreground: "#1a1a1a" },
  // Colors sold in the shop come from the shop catalog.
  ...Object.fromEntries(
    SHOP_ITEMS.filter(
      (item): item is AccentShopItem => item.kind === "accent"
    ).map((item) => [
      item.value,
      {
        primary: item.color,
        foreground: item.foreground,
        ...(item.image ? { image: item.image } : {}),
      },
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

  // A theme and an accent color are mutually exclusive: the theme owns the
  // app accent while it is on, so the settings must never show both equipped.
  const [accentColor, setAccentColorState] = React.useState<string>(() => {
    const cached = getSettingSync("accent-color")
    return typeof cached === "string" ? cached : ""
  })

  // Deco theme (shop "thèmes"): which themed objects decorate the pages.
  // Empty string = no decor.
  const [decoTheme, setDecoThemeState] = React.useState<string>(() => {
    const cached = getSettingSync("deco-theme")
    return typeof cached === "string" ? cached : ""
  })

  React.useEffect(() => {
    void Promise.all([
      getSetting("accent-color"),
      getSetting("deco-theme"),
    ]).then(([accent, deco]) => {
      const theme = typeof deco === "string" ? deco : ""
      setDecoThemeState(theme)
      setAccentColorState(theme ? "" : typeof accent === "string" ? accent : "")
    })
  }, [])

  const setAccentColor = React.useCallback((color: string) => {
    setSetting("accent-color", color)
    setAccentColorState(color)
    if (color) {
      setSetting("deco-theme", "")
      setDecoThemeState("")
    }
  }, [])

  const setDecoTheme = React.useCallback((value: string) => {
    setSetting("deco-theme", value)
    setDecoThemeState(value)
  }, [])

  // Une synchronisation a pu changer le thème, l'accent ou le décor : on les relit.
  React.useEffect(() => {
    const reload = () => {
      void getSetting(storageKey).then((stored) => {
        if (typeof stored === "string" && isTheme(stored)) setThemeState(stored)
      })
      void Promise.all([
        getSetting("accent-color"),
        getSetting("deco-theme"),
      ]).then(([accent, deco]) => {
        const theme = typeof deco === "string" ? deco : ""
        setDecoThemeState(theme)
        setAccentColorState(typeof accent === "string" ? accent : "")
      })
    }
    window.addEventListener(SETTINGS_SYNCED_EVENT, reload)
    return () => window.removeEventListener(SETTINGS_SYNCED_EVENT, reload)
  }, [storageKey])

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
      // A deco theme owns the accent while it is active: its hue must not
      // fight the equipped accent color. Removing the theme hands `--primary`
      // back to the accent color.
      const theme = isDecoThemeId(decoTheme) ? DECO_THEMES[decoTheme] : null
      const accent = theme ? null : ACCENT_COLORS[accentColor]
      const primary = theme?.accent ?? accent?.primary
      const isDark = root.classList.contains("dark")

      // A theme repaints the real surfaces, not just a faint overlay behind
      // the cards: background, cards, sheets and soft fills all take its hue.
      if (theme) {
        const mix = (percent: number, base: string) =>
          `color-mix(in srgb, ${theme.accent} ${percent}%, var(${base}))`
        root.style.setProperty(
          "--background",
          mix(isDark ? 26 : 14, "--background-base")
        )
        root.style.setProperty("--card", mix(isDark ? 22 : 10, "--card-base"))
        root.style.setProperty(
          "--popover",
          mix(isDark ? 22 : 10, "--popover-base")
        )
        root.style.setProperty("--muted", mix(isDark ? 28 : 16, "--muted-base"))
        root.style.setProperty(
          "--secondary",
          mix(isDark ? 28 : 16, "--secondary-base")
        )
      } else {
        root.style.removeProperty("--background")
        root.style.removeProperty("--card")
        root.style.removeProperty("--popover")
        root.style.removeProperty("--muted")
        root.style.removeProperty("--secondary")
      }

      if (!primary) {
        root.style.removeProperty("--primary")
        root.style.removeProperty("--primary-foreground")
        root.style.removeProperty("--accent-bg-overlay")
        root.style.removeProperty("--primary-bg-image")
        return
      }

      const alpha = isDark ? 0.08 : 0.04

      root.style.setProperty("--primary", primary)
      root.style.setProperty(
        "--primary-foreground",
        theme ? "#ffffff" : (accent?.foreground ?? "#ffffff")
      )
      root.style.setProperty(
        "--accent-bg-overlay",
        `color-mix(in srgb, ${primary} ${alpha * 100}%, transparent)`
      )
      // A gradient accent paints over the solid primary surfaces only (see
      // index.css); the soft primary tints and texts keep the solid color.
      // Themes are always a flat signature hue.
      if (accent?.image) {
        root.style.setProperty("--primary-bg-image", accent.image)
      } else {
        root.style.removeProperty("--primary-bg-image")
      }
    }

    applyAccent()

    const observer = new MutationObserver(applyAccent)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [accentColor, decoTheme])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      accentColor,
      setAccentColor,
      decoTheme,
      setDecoTheme,
    }),
    [theme, setTheme, accentColor, setAccentColor, decoTheme, setDecoTheme]
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
