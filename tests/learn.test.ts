import { describe, expect, test } from "bun:test"
import {
  CHEST_TAPS,
  EMPTY_LEARN,
  chestOutcome,
  gemBalance,
  gemQuests,
  gemsEarnedInWeek,
  gemsForMistakes,
  mergeLearn,
  parseLearn,
  withGemExchange,
} from "../src/features/learn/progress"
import {
  balanceOf,
  mergeWallets,
  parseWallet,
} from "../src/features/shop/wallet"
import { parseDoc } from "../src/features/sync/document"
import {
  LESSONS,
  LEVELS,
  levelFromClass,
  programmeSource,
} from "../src/pages/learn/curriculum"
import { buildExercises, CHECKPOINT_LENGTH } from "../src/pages/learn/exercises"
import { buildPath } from "../src/pages/learn/path"
import { rankLessons } from "../src/pages/learn/ranking"

describe("Apprendre", () => {
  test("adapte le parcours à la classe et au calendrier des programmes", () => {
    expect(levelFromClass("3EMEB")).toBe(3)
    expect(levelFromClass("Classe de Quatrième B")).toBe(4)
    expect(levelFromClass("Seconde A")).toBeUndefined()
    const date = new Date(2026, 10, 12)
    expect(programmeSource(5, "Mathématiques", date).url).toContain(
      "MENE2602912A"
    )
    expect(programmeSource(4, "Mathématiques", date).url).not.toContain(
      "MENE2602912A"
    )
    expect(programmeSource(3, "Français", new Date(2028, 8, 1)).url).toContain(
      "MENE2602912A"
    )
    for (const level of LEVELS) {
      const lessons = LESSONS.filter((lesson) => lesson.levels.includes(level))
      const path = buildPath(level, lessons)
      expect(path.flatMap((unit) => unit.checkpoints)).toHaveLength(
        lessons.length
      )
      expect(path.filter((unit) => unit.chestId)).toHaveLength(
        Math.floor(lessons.length / 3)
      )
    }
  })

  test("crée dix questions distinctes avec exactement une bonne réponse", () => {
    for (const lesson of LESSONS) {
      for (const seed of [0, 1, 3, 109, 0xffffffff]) {
        const exercises = buildExercises(lesson, seed)
        expect(exercises).toHaveLength(CHECKPOINT_LENGTH)
        expect(new Set(exercises.map(({ prompt }) => prompt)).size).toBe(
          CHECKPOINT_LENGTH
        )
        for (const { choices, answer } of exercises) {
          expect(new Set(choices).size).toBe(3)
          expect(choices.filter((choice) => choice === answer)).toHaveLength(1)
        }
      }
    }
    const trigonometry = LESSONS.find(({ id }) => id === "trigonometrie")!
    const [, , , cosine, sine, tangent] = buildExercises(trigonometry, 0)
    expect(cosine.answer).toBe("0,8")
    expect(sine.answer).toBe("0,38")
    expect(tangent.answer).toBe("0,53")
  })

  test("classe les devoirs et les séances avant une note récente", () => {
    const lessons = LESSONS.filter((lesson) => lesson.levels.includes(3))
    const ranked = rankLessons(lessons, [
      {
        kind: "homework",
        subject: "Maths",
        text: "Calculer le cosinus et la tangente dans un triangle rectangle.",
        weight: 3,
      },
      {
        kind: "lesson",
        subject: "Mathématiques",
        text: "Sinus : côté opposé sur hypoténuse.",
        weight: 3,
      },
      {
        kind: "grade",
        subject: "Français",
        text: "Proposition subordonnée relative",
        weight: 0.75,
      },
    ])
    expect(ranked[0].lesson.id).toBe("trigonometrie")
    expect(ranked[0].reasons).toEqual(["homework", "lesson"])
    expect(ranked[0].reference?.text).toMatch(/cosinus|hypoténuse/u)
    const focused = rankLessons(lessons, [
      { kind: "lesson", subject: "Maths", text: "Cosinus.", weight: 3 },
    ])
    expect(focused[0].lesson.points[0][0]).toBe("Cosinus")
    const semantic = rankLessons(
      lessons,
      [
        {
          kind: "lesson",
          subject: "Mathématiques",
          text: "Notions du jour.",
          weight: 3,
        },
      ],
      { trigonometrie: [0.9], subordonnees: [0.99] }
    )
    expect(semantic[0].lesson.id).toBe("trigonometrie")
  })

  test("fusionne les meilleurs résultats et les appuis sans doubler le solde", () => {
    expect([0, 1, 2, 3, 10].map(gemsForMistakes)).toEqual([20, 15, 10, 5, 5])
    const a = {
      ...EMPTY_LEARN,
      results: { "3-trigonometrie": 1 },
      chests: { "chest-3-trigonometrie": 3 },
    }
    const b = {
      ...EMPTY_LEARN,
      results: { "3-trigonometrie": 0, "3-fonctions": 2 },
      chests: { "chest-3-trigonometrie": 5 },
    }
    const merged = mergeLearn(a, b)
    expect(mergeLearn(b, a)).toEqual(merged)
    expect(mergeLearn(merged, merged)).toEqual(merged)
    expect(gemBalance(a, "fixture")).toBe(15)
    expect(gemBalance(merged, "fixture")).toBe(
      30 + chestOutcome("fixture", "chest-3-trigonometrie", 5).gems
    )
  })

  test("ne monte que d'un niveau par appui et ouvre au cinquième", () => {
    const id = "chest-3-fonctions"
    let previous = chestOutcome("fixture", id, 0)
    expect(previous.rarity).toBe("Commun")
    for (let taps = 1; taps <= CHEST_TAPS; taps++) {
      const next = chestOutcome("fixture", id, taps)
      expect(next.tier - previous.tier).toBeGreaterThanOrEqual(0)
      expect(next.tier - previous.tier).toBeLessThanOrEqual(1)
      expect(
        gemBalance({ ...EMPTY_LEARN, chests: { [id]: taps } }, "fixture")
      ).toBe(taps === CHEST_TAPS ? next.gems : 0)
      previous = next
    }
  })

  test("accepte les anciens documents de sync et filtre les valeurs invalides", () => {
    const old = {
      v: 1,
      accountId: "fixture",
      deviceId: "test",
      rev: 1,
      savedAt: 0,
    }
    expect(parseDoc(JSON.stringify(old))?.learn).toEqual(EMPTY_LEARN)
    expect(
      parseLearn({
        results: { "3-ok": 0, "3-negatif": -1, "3-trop": 11 },
        chests: { "chest-3-ok": 5, "chest-3-trop": 6 },
      })
    ).toEqual({
      ...EMPTY_LEARN,
      results: { "3-ok": 0 },
      chests: { "chest-3-ok": 5 },
    })
  })

  test("les quêtes d’Apprendre s’accomplissent et se récupèrent une seule fois", () => {
    const week = "2026-11-09"
    const a = parseLearn({
      results: { "3-fractions": 0 },
      practice: { fractions: 1, trigonometrie: 1, fonctions: 1 },
      earnedWeeks: {
        "quest-premier-pas": week,
        "checkpoint-3-fractions-5": week,
      },
    })
    const b = parseLearn({
      ...a,
      earnedWeeks: {
        "quest-premier-pas": "2026-11-16",
        "quest-sans-faute": week,
      },
    })
    const merged = mergeLearn(a, b)
    expect(
      gemQuests(merged).filter((quest) => quest.state === "achieved")
    ).toHaveLength(3)
    expect(gemBalance(merged, "fixture")).toBe(45)
    expect(gemsEarnedInWeek(merged, "fixture", week)).toBe(30)
    expect(mergeLearn(b, a)).toEqual(merged)
  })

  test("convertit dix gemmes par rubis et déduplique les échanges sur deux appareils", () => {
    const a = parseLearn({
      results: { "3-fractions": 0, "3-fonctions": 0 },
      exchanged: 2,
    })
    const b = parseLearn({ ...a, exchanged: 3 })
    const wallet = parseWallet(undefined)
    const left = withGemExchange(wallet, "fixture", a.exchanged)
    const right = withGemExchange(wallet, "fixture", b.exchanged)
    const merged = mergeLearn(a, b)
    expect(gemBalance(merged, "fixture")).toBe(10)
    expect(balanceOf(mergeWallets(left, right))).toBe(3)
    expect(mergeLearn(merged, merged)).toEqual(merged)
  })
})
