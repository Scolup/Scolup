"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { markSeen } from "@/services/storage"
import { triggerHapticLight } from "@/services/haptics"
import { resolveSubjectName, useSubjects } from "@/services/subjects"
import { useGrades } from "./useGrades"

const HIGHLIGHT_MS = 2000

export function useGradesPage() {
  const model = useGrades()
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())
  const highlightTimer = useRef<number | null>(null)

  useSubjects()

  useEffect(() => {
    void markSeen("grades")
  }, [])

  useEffect(
    () => () => {
      if (highlightTimer.current !== null) clearTimeout(highlightTimer.current)
    },
    []
  )

  const scrollToGrade = useCallback((key: string) => {
    triggerHapticLight()
    rowRefs.current.get(key)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
    if (highlightTimer.current !== null) clearTimeout(highlightTimer.current)
    setHighlightedKey(key)
    highlightTimer.current = window.setTimeout(
      () => setHighlightedKey(null),
      HIGHLIGHT_MS
    )
  }, [])

  const registerRow = useCallback((key: string, el: HTMLElement | null) => {
    if (el) rowRefs.current.set(key, el)
    else rowRefs.current.delete(key)
  }, [])

  const openGrade = useCallback((key: string) => {
    triggerHapticLight()
    setSelectedKey(key)
  }, [])

  const selected =
    selectedKey !== null
      ? (model.grades.find((grade) => grade.key === selectedKey) ?? null)
      : null

  return {
    ...model,
    highlightedKey,
    registerRow,
    scrollToGrade,
    openGrade,
    closeGrade: () => setSelectedKey(null),
    selected,
    selectedSubject: selected
      ? resolveSubjectName(selected.subjectCode, selected.subject)
      : "",
    selectedPeriodLabel: selected
      ? model.periods.find((period) => period.id === selected.period)?.label
      : undefined,
  }
}
