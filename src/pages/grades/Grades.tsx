import { useDelayedLoading } from "@/hooks/useDelayedLoading"
import { useGradesPage } from "./hooks/useGradesPage"
import { GradeDrawer } from "./components/GradeDrawer"
import { GradesContent } from "./components/GradesContent"
import { PeriodPicker } from "./components/PeriodPicker"
import { DecoSprinkles, DecoSticker } from "@/components/DecoOrnament"

export function Grades() {
  const page = useGradesPage()
  const showSkeleton = useDelayedLoading(page.loading)

  return (
    <div className="relative isolate flex w-full flex-col gap-0">
      <div className="relative sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 px-4 py-2">
        <DecoSticker charm={0} className="top-1/2 right-3 -translate-y-1/2" />
        <PeriodPicker
          periods={page.periods}
          selected={page.selectedPeriod}
          onSelect={page.setSelectedPeriod}
        />
      </div>

      <div className="min-h-[50dvh]">
        <GradesContent page={page} showSkeleton={showSkeleton} />
        <DecoSprinkles />
      </div>

      <GradeDrawer
        grade={page.selected}
        subject={page.selectedSubject}
        periodLabel={page.selectedPeriodLabel}
        evalColors={page.evalColors}
        onClose={page.closeGrade}
      />
    </div>
  )
}
