import { describe, expect, test } from "bun:test"
import { syncTimeLabel } from "../src/hooks/use-last-sync"

describe("syncTimeLabel", () => {
  test("sans synchro, pas de libellé", () => {
    expect(syncTimeLabel(null)).toBeNull()
  })

  test("affiche l'heure de la dernière synchro", () => {
    const ts = new Date(2026, 9, 8, 9, 28).getTime()
    expect(syncTimeLabel(ts)).toBe("Dernière mise à jour à 9:28")
  })
})
