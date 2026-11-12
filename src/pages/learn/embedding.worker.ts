import type { Similarities } from "./ranking"
import type { EmbeddingRequest } from "@/services/learnEmbeddings"

const RUNTIME = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
const MODEL = "Xenova/multilingual-e5-small"

type Embed = (
  inputs: string[],
  options: { pooling: "mean"; normalize: true }
) => Promise<{ tolist(): number[][] }>

interface Runtime {
  env: { backends: { onnx: { wasm?: { numThreads: number; proxy: boolean } } } }
  pipeline: (
    task: "feature-extraction",
    model: string,
    options: {
      device: "wasm"
      dtype: "q8"
      revision: string
    }
  ) => Promise<Embed>
}

async function loadModel() {
  const { env, pipeline }: Runtime = await import(/* @vite-ignore */ RUNTIME)
  const wasm = env.backends.onnx.wasm
  if (wasm) {
    wasm.numThreads = 1
    wasm.proxy = false
  }
  return pipeline("feature-extraction", MODEL, {
    device: "wasm",
    dtype: "q8",
    revision: "761b726",
  })
}

let model: Promise<Embed> | undefined
let retryAt = 0

function getModel() {
  if (!model && Date.now() >= retryAt) {
    model = loadModel().catch((error: unknown) => {
      retryAt = Date.now() + 30_000
      model = undefined
      throw error
    })
  }
  return model
}

async function rank({
  queries,
  passages,
}: Extract<EmbeddingRequest, { kind: "rank" }>) {
  const embed = await getModel()
  if (!embed) return
  const inputs = [
    ...queries.map((query) => `query: ${query}`),
    ...passages.map((passage) => `passage: ${passage.text}`),
  ]
  const vectors: number[][] = []
  for (let index = 0; index < inputs.length; index += 4) {
    const batch = await embed(inputs.slice(index, index + 4), {
      pooling: "mean",
      normalize: true,
    })
    vectors.push(...batch.tolist())
  }
  const queryVectors = vectors.slice(0, queries.length)
  const similarities: Similarities = {}
  for (const [index, passage] of passages.entries()) {
    const vector = vectors[queries.length + index]
    similarities[passage.id] = queryVectors.map((query) =>
      query.reduce(
        (sum, value, dimension) => sum + value * vector[dimension],
        0
      )
    )
  }
  return similarities
}

let queue = Promise.resolve()
self.onmessage = ({ data }: MessageEvent<EmbeddingRequest>) => {
  if (data.kind === "warm") {
    void getModel()?.catch(() => {})
    return
  }
  queue = queue.then(async () => {
    const similarities = await rank(data).catch(() => undefined)
    self.postMessage({ id: data.id, similarities })
  })
}
