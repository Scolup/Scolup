import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, Book02Icon } from "@hugeicons/core-free-icons"
import { errorMessage } from "@/services/errors"
import { useAsync } from "@/hooks/useAsync"
import { useLiveRefresh } from "@/hooks/useLiveRefresh"
import { subjectId } from "@/features/subjects/names"
import { fetchDisciplineSubjects } from "@/features/subjects/disciplines"
import { ensureSubjects } from "@/features/subjects/edit"
import { useSubjects } from "@/features/subjects/store"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { type ListedSubject, SubjectRow } from "./SubjectRow"

const NO_SUBJECTS: ListedSubject[] = []

export function SubjectsSettings() {
  const [reloadKey, setReloadKey] = useState(0)
  useSubjects()
  const liveGrades = useLiveRefresh("grades")
  const { data, error, loading } = useAsync(async () => {
    const disciplines = await fetchDisciplineSubjects()
    const list: ListedSubject[] = disciplines.map((subject) => ({
      ...subject,
      id: subjectId(subject.code, subject.name),
    }))
    await ensureSubjects(
      list.map((subject) => ({ code: subject.code, name: subject.name }))
    )
    return list
  }, [reloadKey, liveGrades])

  const subjects = data ?? NO_SUBJECTS
  const message = error
    ? errorMessage(error, "Impossible de charger les matières.")
    : null

  const content = useMemo(() => {
    if (loading) {
      return (
        <div aria-hidden="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-14 w-full rounded-3xl" />
          ))}
        </div>
      )
    }
    if (message) {
      return (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          <AlertAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Réessayer
            </Button>
          </AlertAction>
        </Alert>
      )
    }
    if (subjects.length === 0) {
      return (
        <Empty>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Book02Icon} aria-hidden="true" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Aucune matière</EmptyTitle>
            <EmptyDescription>
              Tes matières apparaîtront ici dès que ton relevé sera chargé.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }
    return (
      <div className="flex flex-col gap-2">
        {subjects.map((subject) => (
          <SubjectRow key={subject.id} subject={subject} />
        ))}
      </div>
    )
  }, [subjects, loading, message])

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">
        Personnalise le nom, la couleur et le coefficient de chaque matière.
      </p>
      {content}
    </div>
  )
}
