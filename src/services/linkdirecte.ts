import { Linkdirecte, indexedDBStorage } from "linkdirecte"

export const ld = new Linkdirecte({
  storage: indexedDBStorage,
  proxyUrl: "https://proxy.api.scolup.com",
  maxRetries: 2,
})
