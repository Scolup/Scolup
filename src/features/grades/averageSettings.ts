import { createStore } from "@/lib/createStore"
import { getSetting, setSetting } from "@/services/storage"
import { isAverageMethod, isAverageScale } from "./averages"
import { type AverageMethod, type AverageScale } from "./types"

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
  } catch {
    // Miroir illisible : on garde les réglages par défaut.
  }
  return { method, scale }
}

const store = createStore<AverageSettings>(readMirror(), () => void hydrate())

async function hydrate(): Promise<void> {
  try {
    const [storedMethod, storedScale] = await Promise.all([
      getSetting("gradesAverageMethod"),
      getSetting("gradesAverageScale"),
    ])
    const current = store.get()
    let next: AverageSettings | null = null
    if (isAverageMethod(storedMethod)) {
      next = { ...(next ?? current), method: storedMethod }
    }
    const scaleNumber =
      typeof storedScale === "string" ? Number(storedScale) : storedScale
    if (isAverageScale(scaleNumber)) {
      next = { ...(next ?? current), scale: scaleNumber }
    }
    if (
      next &&
      (next.method !== current.method || next.scale !== current.scale)
    ) {
      store.set(next)
    }
  } catch {
    // Lecture impossible : on garde les réglages déjà connus.
  }
}

void hydrate()

export function useAverageSettings(): AverageSettings {
  return store.use()
}

export async function setAverageMethod(method: AverageMethod): Promise<void> {
  const current = store.get()
  if (method === current.method) return
  store.set({ ...current, method })
  await setSetting("gradesAverageMethod", method)
}

export async function setAverageScale(scale: AverageScale): Promise<void> {
  const current = store.get()
  if (scale === current.scale) return
  store.set({ ...current, scale })
  await setSetting("gradesAverageScale", String(scale))
}
