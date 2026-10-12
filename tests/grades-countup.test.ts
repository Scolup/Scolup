import { describe, expect, test } from "bun:test"
import {
  countUpValue,
  gradeScore20,
  isGreatGrade,
  type Grade,
} from "../src/pages/grades/helpers"

function makeGrade(value: string, outOf = "20", nonSignificant = false): Grade {
  return {
    key: "k",
    subject: "Maths",
    title: "DS",
    value,
    outOf,
    coef: "1",
    period: "A001",
    competencies: [],
    nonSignificant,
  }
}

describe("countUpValue", () => {
  test("progress 0 vaut from, 1 vaut to", () => {
    expect(countUpValue(10, 15, 0)).toBe(10)
    expect(countUpValue(10, 15, 1)).toBe(15)
  })

  test("ease-out : mi-parcours dépasse la moitié", () => {
    expect(countUpValue(0, 20, 0.5)).toBeGreaterThan(10)
  })

  test("progress clampé à [0, 1]", () => {
    expect(countUpValue(10, 15, -1)).toBe(10)
    expect(countUpValue(10, 15, 2)).toBe(15)
  })
})

describe("gradeScore20 / isGreatGrade", () => {
  test("ramène toutes les échelles sur 20", () => {
    expect(gradeScore20(makeGrade("16"))).toBe(16)
    expect(gradeScore20(makeGrade("8", "10"))).toBe(16)
    expect(gradeScore20(makeGrade("14,5"))).toBe(14.5)
  })

  test("seuil à 16 : 18/20 oui, 12/20 non", () => {
    expect(isGreatGrade(makeGrade("18"))).toBe(true)
    expect(isGreatGrade(makeGrade("12"))).toBe(false)
  })

  test("jamais de célébration sans vraie note chiffrée", () => {
    expect(isGreatGrade(makeGrade(""))).toBe(false)
    expect(isGreatGrade(makeGrade("16", "20", true))).toBe(false)
    expect(isGreatGrade(makeGrade("Abs", "20"))).toBe(false)
  })
})
