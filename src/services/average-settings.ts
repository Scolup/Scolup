import { useSyncExternalStore } from "react"
import { getSetting, setSetting } from "@/services/storage"
import {
  isAverageMethod,
  isAverageScale,
  type AverageMethod,
  type AverageScale,
} from "@/pages/grades/helpers"

export type { AverageMethod, AverageScale }

interface AverageSettings {
  method: AverageMethod
  scale: AverageScale
}

const DEFAULTS: AverageSettings = { method: "subject", scale: 20 }

function readMirror(): AverageSettings {
  let method: AverageMethod = DEFAULTS.method
  let scale: AverageScale = DEFAULTS.scale
  try {
    const rawMethod = localStorage.getItem("scolup:gradesAverageMethod")
    if (rawMethod !== null) {
      const parsed: unknown = JSON.parse(rawMethod)
      if (isAverageMethod(parsed)) method = parsed
    }
    const rawScale = localStorage.getItem("scolup:gradesAverageScale")
    if (rawScale !== null) {
      const parsed: unknown = JSON.parse(rawScale)
      const asNumber =
        typeof parsed === "string" ? Number(parsed) : (parsed as unknown)
      if (isAverageScale(asNumber)) scale = asNumber
    }
  } catch {}
  return { method, scale }
}

let cache: AverageSettings = readMirror()
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

async function hydrate(): Promise<void> {
  try {
    const [storedMethod, storedScale] = await Promise.all([
      getSetting("gradesAverageMethod"),
      getSetting("gradesAverageScale"),
    ])
    let next: AverageSettings | null = null
    if (isAverageMethod(storedMethod)) {
      next = { ...(next ?? cache), method: storedMethod }
    }
    const scaleNumber =
      typeof storedScale === "string" ? Number(storedScale) : storedScale
    if (isAverageScale(scaleNumber)) {
      next = { ...(next ?? cache), scale: scaleNumber }
    }
    if (next && (next.method !== cache.method || next.scale !== cache.scale)) {
      cache = next
      emit()
    }
  } catch {}
}

void hydrate()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  void hydrate()
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): AverageSettings {
  return cache
}

export function useAverageSettings(): AverageSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export async function setAverageMethod(method: AverageMethod): Promise<void> {
  if (method === cache.method) return
  cache = { ...cache, method }
  emit()
  await setSetting("gradesAverageMethod", method)
}

export async function setAverageScale(scale: AverageScale): Promise<void> {
  if (scale === cache.scale) return
  cache = { ...cache, scale }
  emit()
  await setSetting("gradesAverageScale", String(scale))
}
