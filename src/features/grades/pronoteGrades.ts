import { gradeOn20, GradeKind } from "litenote"
import { withPronote } from "@/services/litenote"
import { getSetting } from "@/services/storage"
import { toEvalColors } from "./mappers"
import { parseGradeNumber } from "./grade"
import { resolvePeriod } from "./periods"
import type { Grade, OfficialAverages } from "./types"

const coefficientSuffix =
  /\s*(?:[·–—-]\s*)?(?:[(\[]\s*)?\bcoef(?:ficient)?\.?\s*[:=]?\s*(\d+(?:[.,]\d+)?)(?:\s*[)\]])?\s*$/i

export async function fetchPronoteGrades() {
  const [{ reports, defaultPeriod }, stored] = await Promise.all([
    withPronote((client) => client.grades()),
    getSetting("gradesPeriod"),
  ])
  const periods = reports.map(({ period }) => ({
    id: period.id,
    label: period.name,
  }))
  const grades = reports.flatMap(({ period, overview }) =>
    overview.grades.map((grade): Grade => {
      const outOf = grade.outOf.points || grade.defaultOutOf?.points || 20
      const zero =
        grade.value.kind === GradeKind.AbsentZero ||
        grade.value.kind === GradeKind.UnreturnedZero
      const labels: Partial<Record<number, string>> = {
        [GradeKind.Absent]: "Absent",
        [GradeKind.Exempted]: "Dispensé",
        [GradeKind.NotGraded]: "Non noté",
        [GradeKind.Unreturned]: "Non rendu",
        [GradeKind.Unfit]: "Inapte",
      }
      const description = grade.comment?.trim() ?? ""
      const coefficient =
        parseGradeNumber(grade.coefficient) ??
        parseGradeNumber(description.match(coefficientSuffix)?.[1]) ??
        1
      return {
        key: "pronote:" + grade.id,
        subject: grade.subject.name,
        subjectCode: "pn:" + grade.subject.id,
        title:
          description.replace(coefficientSuffix, "").trim() || "Évaluation",
        comment: grade.commentaireSurNote,
        date: grade.date,
        value: zero
          ? "0"
          : grade.value.kind === GradeKind.Grade
            ? String(grade.value.points)
            : (labels[grade.value.kind] ?? ""),
        outOf: String(outOf),
        coef: String(coefficient),
        period: period.id,
        competencies: [],
        nonSignificant: grade.isBonus || grade.isOptional,
        classAverage: gradeOn20(grade.average, outOf),
      }
    })
  )
  const officialAverages: Record<string, OfficialAverages> = Object.fromEntries(
    reports.map(({ period, overview }) => [
      period.id,
      {
        student: gradeOn20(overview.overallAverage),
        classAverage: gradeOn20(overview.classAverage),
        subjects: Object.fromEntries(
          overview.subjectsAverages.map((subject) => [
            "pn:" + subject.subject.id,
            {
              student: gradeOn20(
                subject.student,
                (subject.outOf ?? subject.defaultOutOf)?.points
              ),
              classAverage: gradeOn20(
                subject.class_average,
                (subject.outOf ?? subject.defaultOutOf)?.points
              ),
            },
          ])
        ),
      },
    ])
  )
  const selected =
    periods.some((period) => period.id === stored) && typeof stored === "string"
      ? stored
      : defaultPeriod
  return {
    grades,
    periods,
    evalColors: toEvalColors(undefined),
    defaultPeriod: resolvePeriod(periods, selected),
    officialAverages,
  }
}
