import { createStore } from "@/lib/createStore"
import { getDB, type SubjectRecord } from "@/services/storage"
import { markDirty } from "@/services/syncSignal"

// null tant que la liste n'a jamais été chargée.
const store = createStore<SubjectRecord[] | null>(
  readLocalMirror(),
  () => void hydrate()
)

let hydrating = false

let hydrated = false

function readLocalMirror(): SubjectRecord[] | null {
  try {
    const raw = localStorage.getItem("scolup:subjects")
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const list = parsed.filter(
      (entry): entry is SubjectRecord =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as SubjectRecord).id === "string" &&
        typeof (entry as SubjectRecord).name === "string"
    )
    return list
  } catch {
    return null
  }
}

function writeLocalMirror(list: SubjectRecord[]): void {
  try {
    localStorage.setItem("scolup:subjects", JSON.stringify(list))
  } catch {
    // Stockage local indisponible (mode privé, quota) : le miroir est facultatif.
  }
}

async function hydrate(): Promise<void> {
  if (hydrating || hydrated) return
  hydrating = true
  try {
    const db = await getDB()
    const stored = await db.getAll("subjects")
    if (stored.length > 0 || store.get() === null) {
      writeLocalMirror(stored)
      store.set(stored)
    }
    hydrated = true
  } catch {
    // Base inaccessible : on garde la liste du miroir local.
  } finally {
    hydrating = false
  }
}

void hydrate()

export function useSubjects(): SubjectRecord[] | null {
  return store.use()
}

// La liste actuelle, vide tant qu'elle n'est pas chargée.
export function currentSubjects(): SubjectRecord[] {
  return store.get() ?? []
}

// Charge la liste depuis la base (une seule fois) puis la renvoie.
export async function loadSubjects(): Promise<SubjectRecord[]> {
  await hydrate()
  hydrated = true
  return [...currentSubjects()]
}

export async function persist(list: SubjectRecord[]): Promise<void> {
  writeLocalMirror(list)
  store.set(list)
  try {
    const db = await getDB()
    const tx = db.transaction("subjects", "readwrite")
    await Promise.all(list.map((entry) => tx.store.put(entry, entry.id)))
    await tx.done
    markDirty()
  } catch {
    // Écriture en base impossible : la liste reste en mémoire et dans le miroir local.
  }
}

// Relit la liste depuis la base, après qu'une synchronisation l'a modifiée.
export async function reloadSubjects(): Promise<void> {
  hydrated = false
  await hydrate()
}
