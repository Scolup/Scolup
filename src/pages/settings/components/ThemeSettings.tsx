import { AccentColorPicker } from "@/components/AccentColorPicker"
import { useTheme } from "@/components/ThemeProvider"
import { track } from "@/features/quests/service"
import { useShop } from "@/features/shop/useShop"
import { triggerHapticLight } from "@/services/haptics"
import { DecoThemePicker } from "./DecoThemePicker"

// Appearance screen: the app color (free + bought) and, below, the decorated
// themes bought in the ruby shop.
export function ThemeSettings() {
  const { accentColor, setAccentColor, decoTheme, setDecoTheme } = useTheme()
  const { state: shop } = useShop()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="px-1 text-sm text-muted-foreground">Couleurs</p>
        <div className="rounded-3xl border border-border/70 bg-card px-4 py-5">
          <AccentColorPicker
            label="Couleur de l'application"
            value={accentColor}
            owned={shop.owned}
            onPick={(color) => {
              if (color !== accentColor) {
                triggerHapticLight()
                void track("setting-changed")
              }
              setAccentColor(color)
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="px-1 text-sm text-muted-foreground">Thèmes</p>
        <div className="rounded-3xl border border-border/70 bg-card px-4 py-5">
          <DecoThemePicker
            value={decoTheme}
            owned={shop.owned}
            onPick={(value) => {
              triggerHapticLight()
              void track("setting-changed")
              setDecoTheme(value)
            }}
          />
        </div>
      </div>
    </div>
  )
}
