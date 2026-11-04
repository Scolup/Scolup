// Règles de fusion entre appareils. Chaque fonction est commutative,
// associative et idempotente : merge(a, b) = merge(b, a) et merge(a, a) = a.
// C'est ce qui rend la synchronisation sûre sans serveur ni ordre d'écriture.
//
// Pur : pas de React, pas d'IndexedDB.

import { GRADE_STREAK_ID } from "@/features/quests/constants"
import type { ProgressMap, QuestProgress } from "@/features/quests/types"
import type { Ledger } from "@/features/quests/schoolEvents"
import type { SubjectRecord } from "@/services/storage"

const MAX_SEEN = 300 // même plafond que apply.ts

// Comparaison déterministe quand deux versions ont le même horodatage : tous
// les appareils choisissent la même.
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        )
      : v
  )
}

function newest<T>(a: T, ta: number, b: T, tb: number): T {
  if (ta !== tb) return ta > tb ? a : b
  return canonical(a) >= canonical(b) ? a : b
}

function union(a: string[] | undefined, b: string[] | undefined): string[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])]
}

// ---- Réglages : le dernier écrit gagne, clé par clé ------------------------

export interface SyncedSetting {
  v: string | boolean
  t: number // ms, posé par setSetting
}

export function mergeSettings(
  a: Record<string, SyncedSetting>,
  b: Record<string, SyncedSetting>
): Record<string, SyncedSetting> {
  const out: Record<string, SyncedSetting> = { ...a }
  for (const [key, remote] of Object.entries(b)) {
    const local = out[key]
    out[key] = local ? newest(local, local.t, remote, remote.t) : remote
  }
  return out
}

// ---- Matières : par matière, la dernière personnalisation gagne ------------
// Une matière créée automatiquement n'a pas d'updatedAt (0) : elle ne peut
// jamais écraser une personnalisation faite sur un autre appareil.

export function mergeSubjects(
  a: Record<string, SubjectRecord>,
  b: Record<string, SubjectRecord>
): Record<string, SubjectRecord> {
  const out: Record<string, SubjectRecord> = { ...a }
  for (const [id, remote] of Object.entries(b)) {
    const local = out[id]
    out[id] = local
      ? newest(local, local.updatedAt ?? 0, remote, remote.updatedAt ?? 0)
      : remote
  }
  return out
}

// ---- Quêtes -----------------------------------------------------------------

// Jauges qui peuvent redescendre (série de notes) : le max ressusciterait une
// série cassée, on prend donc la plus récente.
const GAUGES = new Set([GRADE_STREAK_ID])

function mergeProgressEntry(
  id: string,
  a: QuestProgress,
  b: QuestProgress
): QuestProgress {
  // Une période plus récente (nouvelle semaine) remplace l'ancienne.
  if (a.period !== b.period) return a.period > b.period ? a : b
  if (GAUGES.has(id)) return newest(a, a.u ?? 0, b, b.u ?? 0)
  const seen =
    a.seen || b.seen ? union(a.seen, b.seen).slice(-MAX_SEEN) : undefined
  const hasU = a.u !== undefined || b.u !== undefined
  return {
    count: Math.max(a.count, b.count),
    period: a.period,
    done: a.done || b.done,
    ...(seen ? { seen } : {}),
    ...(hasU ? { u: Math.max(a.u ?? 0, b.u ?? 0) } : {}),
  }
}

export function mergeProgress(a: ProgressMap, b: ProgressMap): ProgressMap {
  const out: ProgressMap = { ...a }
  for (const [id, remote] of Object.entries(b)) {
    out[id] = out[id] ? mergeProgressEntry(id, out[id], remote) : remote
  }
  return out
}

// Registre des devoirs. Les champs viennent de l'école, donc identiques d'un
// appareil à l'autre ; seuls `done` et le drapeau `x` (« fait hors Scolup »,
// qui ne doit jamais être effacé) peuvent différer. On prend le OU des deux :
// le prochain rafraîchissement depuis l'école remet `done` d'aplomb.
export function mergeLedgers(a: Ledger, b: Ledger): Ledger {
  const out: Ledger = { ...a }
  for (const [id, remote] of Object.entries(b)) {
    const local = out[id]
    if (!local) {
      out[id] = remote
      continue
    }
    const x = local.x === true || remote.x === true
    out[id] = {
      d: local.d >= remote.d ? local.d : remote.d,
      done: local.done || remote.done,
      test: local.test || remote.test,
      s: local.s >= remote.s ? local.s : remote.s,
      n: local.n >= remote.n ? local.n : remote.n,
      ...(x ? { x: true } : {}),
    }
  }
  return out
}

// Notes déjà vues. `null` = « jamais chargé » : un appareil neuf adopte la
// liste de l'autre au lieu de payer toutes les notes existantes comme neuves.
export function mergeSeenGrades(
  a: string[] | null,
  b: string[] | null,
  cap: number
): string[] | null {
  if (a === null) return b
  if (b === null) return a
  return union(a, b).slice(-cap)
}
