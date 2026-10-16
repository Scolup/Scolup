"use client"

import {
  isAverageMethod,
  isAverageScale,
  type AverageMethod,
} from "@/pages/grades/helpers"
import {
  setAverageMethod,
  setAverageScale,
  useAverageSettings,
} from "@/services/average-settings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const METHOD_OPTIONS = [
  { value: "subject", label: "Par matière" },
  { value: "weighted", label: "Pondérée" },
  { value: "median", label: "Médiane" },
] as const

const METHOD_HINTS: Record<AverageMethod, string> = {
  subject: "Moyenne de chaque matière, pondérée par son coefficient.",
  weighted:
    "Toutes les notes dans un seul panier, chacune pesée par le coefficient de sa matière.",
  median: "Note du milieu une fois les notes triées.",
}

const SCALE_OPTIONS = [
  { value: "20", label: "Sur 20" },
  { value: "10", label: "Sur 10" },
  { value: "100", label: "Sur 100" },
] as const

export function GradesSettings() {
  const { method, scale } = useAverageSettings()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="px-1 text-sm text-muted-foreground">
          Calcul et affichage de tes moyennes
        </p>
        <div className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card px-4 py-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-average-method"
              className="text-xs font-medium text-muted-foreground"
            >
              Calcul de la moyenne
            </label>
            <Select
              items={METHOD_OPTIONS}
              value={method}
              onValueChange={(value) => {
                if (isAverageMethod(value)) void setAverageMethod(value)
              }}
            >
              <SelectTrigger id="settings-average-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {METHOD_HINTS[method]}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-average-scale"
              className="text-xs font-medium text-muted-foreground"
            >
              Affichage de la moyenne
            </label>
            <Select
              items={SCALE_OPTIONS}
              value={String(scale)}
              onValueChange={(value) => {
                const parsed = value === null ? NaN : Number(value)
                if (isAverageScale(parsed)) void setAverageScale(parsed)
              }}
            >
              <SelectTrigger id="settings-average-scale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
