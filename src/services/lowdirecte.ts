import { Lowdirecte, indexedDBStorage } from "lowdirecte"

export const ld = new Lowdirecte({
  storage: indexedDBStorage,
  proxyUrl: "https://proxy.api.scolup.com",
  maxRetries: 2,
})
