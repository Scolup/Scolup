import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useLearnProgress } from "@/features/learn/learnStore"
import { useAsync } from "@/hooks/useAsync"
import { setSetting } from "@/services/storage"
import { triggerHapticLight } from "@/services/haptics"
import { getLearnSimilarities } from "@/services/learnEmbeddings"
import type { LearnView } from "../components/LearnDashboard"
import { LESSONS, type Lesson, type Level } from "../curriculum"
import { fetchLearnContext, fetchLearnIdentity } from "../fetchLearnContext"
import { buildPath } from "../path"
import { rankLessons, type SchoolSignal } from "../ranking"

type Selection =
  | {
      kind: "review"
      lesson: Lesson
      reference?: Pick<SchoolSignal, "kind" | "text">
    }
  | { kind: "exercise"; lesson: Lesson; checkpoint?: string; bilan?: boolean }
  | { kind: "chest"; id: string; prerequisites: string[] }

const NO_SIGNALS: SchoolSignal[] = []

export function useLearnPage() {
  const [params, setParams] = useSearchParams()
  const requestedView = params.get("vue")
  const view: LearnView =
    requestedView === "parcours" ||
    requestedView === "revisions" ||
    requestedView === "exercices" ||
    requestedView === "gemmes"
      ? requestedView
      : "accueil"
  const [reload, setReload] = useState(0)
  const identity = useAsync(fetchLearnIdentity, [reload])
  const account = identity.data?.id
  const [manualLevel, setManualLevel] = useState<{
    account: string
    level: Level
  }>()
  const level =
    identity.data?.level ??
    (manualLevel && manualLevel.account === account
      ? manualLevel.level
      : identity.data?.savedLevel)
  const context = useAsync(
    () => (account ? fetchLearnContext(account) : Promise.resolve(NO_SIGNALS)),
    [account, reload]
  )
  const signals = context.data ?? NO_SIGNALS
  const lessons = useMemo(
    () => LESSONS.filter((lesson) => level && lesson.levels.includes(level)),
    [level]
  )
  const units = useMemo(
    () => (level ? buildPath(level, lessons) : []),
    [level, lessons]
  )
  const progress = useLearnProgress(account)
  const { data: embeddings } = useAsync(
    async () => ({
      lessons,
      signals,
      scores: await getLearnSimilarities(lessons, signals),
    }),
    [lessons, signals]
  )
  const similarities =
    embeddings?.lessons === lessons && embeddings.signals === signals
      ? embeddings.scores
      : undefined
  const ranked = useMemo(
    () => rankLessons(lessons, signals, similarities),
    [lessons, signals, similarities]
  )
  const [selection, setSelection] = useState<Selection | null>(null)

  function chooseLevel(next: Level) {
    if (!account) return
    triggerHapticLight()
    setManualLevel({ account, level: next })
    void setSetting(`learn-level:${account}`, String(next)).catch(() => {})
  }

  function open(view: LearnView) {
    triggerHapticLight()
    setSelection(null)
    setParams(
      view === "accueil"
        ? {}
        : view === "gemmes"
          ? { vue: view, depuis: requestedView ?? "accueil" }
          : { vue: view }
    )
  }

  function closeBank() {
    triggerHapticLight()
    const from = params.get("depuis")
    setParams(
      from === "parcours" || from === "revisions" || from === "exercices"
        ? { vue: from }
        : {},
      { replace: true }
    )
  }

  function select(next: Selection) {
    triggerHapticLight()
    setSelection(next)
  }

  return {
    identity,
    account,
    level,
    chooseLevel,
    view,
    open,
    closeBank,
    lessons,
    units,
    progress,
    ranked,
    selection,
    select,
    close: () => setSelection(null),
    retry: () => setReload((value) => value + 1),
  }
}
