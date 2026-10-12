"use client"

import { useMemo, useState } from "react"
import { ld } from "@/services/linkdirecte"
import { getSetting, setSetting } from "@/services/storage"
import { errorMessage } from "@/services/errors"
import { useAsync } from "@/hooks/use-async"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { resolvePeriod, toPeriod, type Period } from "@/pages/grades/helpers"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export function GradesSettings() {
  const [period, setPeriod] = useState("")
  const liveGrades = useLiveRefresh("grades")
  const { data, error, loading } = useAsync(async () => {
    if (!(await ld.auth.loadSession())) {
      throw new Error("Aucune session active. Reconnecte-toi.")
    }
    const result = (await ld.grades.getGrades()) as { periodes?: unknown }
    const raw = Array.isArray(result.periodes) ? result.periodes : []
    const periods = (raw as Record<string, unknown>[])
      .map(toPeriod)
      .filter((entry): entry is Period => entry !== null)
    const stored = await getSetting("gradesPeriod")
    return {
      periods,
      id:
        resolvePeriod(periods, typeof stored === "string" ? stored : undefined)
          ?.id ?? "",
    }
  }, [liveGrades])

  const periods = useMemo(() => data?.periods ?? [], [data])
  // Stable identity: Base UI syncs `items` into its store on every render.
  const periodItems = useMemo(
    () => periods.map((entry) => ({ value: entry.id, label: entry.label })),
    [periods]
  )
  const selected = period || data?.id || ""
  const failure = error
    ? errorMessage(error, "Impossible de charger les périodes.")
    : null

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">Notes</p>
      <div className="flex flex-col gap-1.5 rounded-3xl border border-border/70 bg-card px-4 py-5">
        {loading ? (
          <>
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-1.5 h-9 w-full rounded-2xl" />
          </>
        ) : periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {failure ?? "Aucune période dans ton relevé."}
          </p>
        ) : (
          <>
            <label
              htmlFor="settings-grades-period"
              className="text-xs font-medium text-muted-foreground"
            >
              Période par défaut
            </label>
            <Select
              items={periodItems}
              value={selected}
              onValueChange={(value) => {
                if (value === null) return
                setPeriod(value)
                void setSetting("gradesPeriod", value)
              }}
            >
              <SelectTrigger id="settings-grades-period" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              La période s'ouvre directement dans l'onglet Notes.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
