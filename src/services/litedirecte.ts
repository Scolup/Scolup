import { Litedirecte, indexedDBStorage } from "litedirecte"

export const ld = new Litedirecte({
  storage: indexedDBStorage,
  proxyUrl: "https://proxy.api.scolup.com",
  maxRetries: 2,
})
