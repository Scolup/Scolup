import type { Lesson } from "@/pages/learn/curriculum"
import type { SchoolSignal, Similarities } from "@/pages/learn/ranking"

export type EmbeddingRequest =
  | { kind: "warm" }
  | {
      kind: "rank"
      id: number
      queries: string[]
      passages: { id: string; text: string }[]
    }

type WorkerReply = { id: number; similarities?: Similarities }

let worker: Worker | undefined
let sequence = 0
const pending = new Map<number, (result?: Similarities) => void>()

function embeddingWorker() {
  if (worker) return worker
  try {
    worker = new Worker(
      new URL("../pages/learn/embedding.worker.ts", import.meta.url),
      { type: "module" }
    )
    worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
      pending.get(data.id)?.(data.similarities)
      pending.delete(data.id)
    }
    worker.onerror = () => {
      worker?.terminate()
      worker = undefined
      for (const resolve of pending.values()) resolve()
      pending.clear()
    }
  } catch {
    return undefined
  }
  return worker
}

export function warmLearnEmbeddings() {
  if (worker) return
  embeddingWorker()?.postMessage({ kind: "warm" } satisfies EmbeddingRequest)
}

export async function getLearnSimilarities(
  lessons: readonly Lesson[],
  signals: readonly SchoolSignal[]
): Promise<Similarities | undefined> {
  if (!lessons.length || !signals.length) return
  const current = embeddingWorker()
  if (!current) return
  const id = ++sequence
  return new Promise((resolve) => {
    pending.set(id, resolve)
    current.postMessage({
      kind: "rank",
      id,
      queries: signals.map(({ subject, text }) => `${subject}. ${text}`),
      passages: lessons.map(({ id, subject, title, keywords, summary }) => ({
        id,
        text: `${subject}. ${title}. ${keywords}. ${summary}`,
      })),
    } satisfies EmbeddingRequest)
  })
}
