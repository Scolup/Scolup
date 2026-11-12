// Le document échangé via le cloud : l'état complet d'un appareil, déjà fusionné
// avec ce qu'il connaît des autres. N'importe quel fichier suffit donc à tout
// restaurer. Pur : pas de React, pas d'IndexedDB.

import type { ProgressMap } from "@/features/quests/types"
import type { Ledger } from "@/features/quests/schoolEvents"
import { MAX_SEEN_GRADES } from "@/features/quests/schoolEvents"
import { mergeWallets, parseWallet, type Wallet } from "@/features/shop/wallet"
import type { SubjectRecord } from "@/services/storage"
import {
  mergeLedgers,
  mergeProgress,
  mergeSeenGrades,
  mergeSettings,
  mergeSubjects,
  type SyncedSetting,
} from "./merge"
import { isSyncedSetting } from "./keys"
import {
  mergeLearn,
  parseLearn,
  type LearnProgress,
} from "@/features/learn/progress"

export const DOC_VERSION = 1

export interface SyncState {
  settings: Record<string, SyncedSetting>
  subjects: Record<string, SubjectRecord>
  wallet: Wallet
  learn: LearnProgress
  quests: {
    progress: ProgressMap
    ledger: Ledger
    seenGrades: string[] | null
  }
}

export interface SyncDoc extends SyncState {
  v: number
  accountId: string
  deviceId: string
  rev: number // compteur d'écritures de cet appareil
  savedAt: number // ms
}

export function mergeStates(a: SyncState, b: SyncState): SyncState {
  return {
    settings: mergeSettings(a.settings, b.settings),
    subjects: mergeSubjects(a.subjects, b.subjects),
    wallet: mergeWallets(a.wallet, b.wallet),
    learn: mergeLearn(a.learn, b.learn),
    quests: {
      progress: mergeProgress(a.quests.progress, b.quests.progress),
      ledger: mergeLedgers(a.quests.ledger, b.quests.ledger),
      seenGrades: mergeSeenGrades(
        a.quests.seenGrades,
        b.quests.seenGrades,
        MAX_SEEN_GRADES
      ),
    },
  }
}

// Empreinte stable de l'état (ni deviceId, ni rev, ni date) : sert à savoir si
// quelque chose a changé depuis le dernier envoi.
export function fingerprint(state: SyncState): string {
  const sort = (_key: string, value: unknown): unknown =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))
        )
      : value
  return JSON.stringify(state, sort)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

// Lit un document venu du cloud. Renvoie null s'il est illisible ou d'une
// autre version : on l'ignore plutôt que de risquer de corrompre l'état local.
export function parseDoc(text: string): SyncDoc | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (!isRecord(raw) || raw.v !== DOC_VERSION) return null
  if (
    typeof raw.accountId !== "string" ||
    typeof raw.deviceId !== "string" ||
    typeof raw.rev !== "number" ||
    typeof raw.savedAt !== "number"
  ) {
    return null
  }

  const settings: Record<string, SyncedSetting> = {}
  if (isRecord(raw.settings)) {
    for (const [key, entry] of Object.entries(raw.settings)) {
      if (!isSyncedSetting(key) || !isRecord(entry)) continue
      const v = entry.v
      const t = entry.t
      if (
        (typeof v === "string" || typeof v === "boolean") &&
        typeof t === "number"
      ) {
        settings[key] = { v, t }
      }
    }
  }

  const subjects: Record<string, SubjectRecord> = {}
  if (isRecord(raw.subjects)) {
    for (const [id, entry] of Object.entries(raw.subjects)) {
      if (
        isRecord(entry) &&
        typeof entry.id === "string" &&
        typeof entry.name === "string"
      ) {
        subjects[id] = entry as unknown as SubjectRecord
      }
    }
  }

  const quests = isRecord(raw.quests) ? raw.quests : {}
  return {
    v: DOC_VERSION,
    accountId: raw.accountId,
    deviceId: raw.deviceId,
    rev: raw.rev,
    savedAt: raw.savedAt,
    settings,
    subjects,
    wallet: parseWallet(raw.wallet),
    learn: parseLearn(raw.learn),
    quests: {
      progress: isRecord(quests.progress)
        ? (quests.progress as ProgressMap)
        : {},
      ledger: isRecord(quests.ledger) ? (quests.ledger as Ledger) : {},
      seenGrades: Array.isArray(quests.seenGrades)
        ? quests.seenGrades.filter((k): k is string => typeof k === "string")
        : null,
    },
  }
}
