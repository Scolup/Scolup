import { EdAuthError, Litedirecte, indexedDBStorage } from "litedirecte"
import { isUnexpectedApiError, reportUnexpectedApiError } from "./apiErrors"
import { markRenewTokenExpired } from "./apiErrorStore"

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 300

// Le SDK gère déjà ses propres relances réseau (3 tentatives) et le
// renouvellement de session : seuls les codes API inattendus passent ici.
async function withRetries<T>(
  task: () => Promise<T>,
  maxAttempts: number
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task()
    } catch (error) {
      if (!isUnexpectedApiError(error)) throw error
      if (attempt === maxAttempts) {
        reportUnexpectedApiError(error)
        throw error
      }
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * attempt)
      )
    }
  }
}

// Relancer une mutation pourrait répéter un envoi de message ou une action sur
// un devoir si la réponse a été perdue : seules les lectures sont relancées.
const RETRIABLE_PREFIXES = ["get", "load", "check", "download", "correlate"]
const SYNC_METHODS = new Set([
  "getAccount",
  "getAccounts",
  "getLastTokenRefresh",
])

function guard<T extends object>(namespace: T): T {
  return new Proxy(namespace, {
    get(target, prop) {
      const value = Reflect.get(target, prop)
      if (
        typeof prop !== "string" ||
        typeof value !== "function" ||
        SYNC_METHODS.has(prop)
      ) {
        return value
      }
      const method = value as (...args: unknown[]) => unknown
      const attempts = RETRIABLE_PREFIXES.some((prefix) =>
        prop.startsWith(prefix)
      )
        ? MAX_ATTEMPTS
        : 1
      return (...args: unknown[]) =>
        withRetries(() => Promise.resolve(method.apply(target, args)), attempts)
    },
  })
}

const client = new Litedirecte({
  storage: indexedDBStorage,
  proxyUrl: "https://proxy.scolup.com",
  maxRetries: 2,
  onError(error: unknown) {
    // 526 vient du renouvellement interne et est avalé par le SDK : on le
    // remonte à la feuille de reconnexion au lieu de le masquer derrière 520.
    if (error instanceof EdAuthError && error.code === "526") {
      markRenewTokenExpired()
    }
  },
})

const holder = client as unknown as Record<string, unknown>
for (const key of [
  "auth",
  "grades",
  "timetable",
  "homework",
  "messages",
  "timeline",
  "attendance",
  "cloud",
  "documents",
  "qcms",
  "settings",
  "downloads",
] as const) {
  holder[key] = guard(holder[key] as object)
}

export const ld = client

// Gesture de dépannage : repartir d'une session Litedirecte vierge. On vide le
// store plutôt que de supprimer la base : le SDK garde des connexions ouvertes
// et `deleteDatabase` resterait bloqué jusqu'au rechargement de la page.
export async function resetLitedirecteData(): Promise<void> {
  ld.destroy()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("litedirecte")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("data")) {
        db.close()
        resolve()
        return
      }
      const tx = db.transaction("data", "readwrite")
      tx.objectStore("data").clear()
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }
  })
}
