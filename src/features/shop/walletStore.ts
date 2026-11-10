// Lecture / écriture du portefeuille dans le store "shop" d'IndexedDB. Les
// fonctions prennent un `get` / un store plutôt que la base : on peut ainsi les
// appeler à l'intérieur d'une transaction (achat, quête) sans en ouvrir une autre.

import {
  parseWallet,
  walletFromLegacy,
  WALLET_KEY,
  type Wallet,
} from "./wallet"

const LEGACY_KEYS = ["rubies", "pending", "owned", "weekly", "xp"]

// Tant qu'aucun portefeuille n'a été écrit, on le reconstruit depuis l'ancien
// format (sans rien écrire : la lecture reste utilisable en lecture seule).
export async function readWallet(
  get: (key: string) => Promise<unknown>
): Promise<Wallet> {
  const raw = await get(WALLET_KEY)
  if (raw !== undefined) return parseWallet(raw)
  const [rubies, pending, owned] = await Promise.all([
    get("rubies"),
    get("pending"),
    get("owned"),
  ])
  return walletFromLegacy({ rubies, pending, owned })
}

interface WritableStore {
  put(value: Wallet, key: string): Promise<unknown>
  delete(key: string): Promise<unknown>
}

// Écrit le portefeuille et efface les anciennes clés, qui ne servent plus.
export async function writeWallet(
  store: WritableStore,
  wallet: Wallet
): Promise<void> {
  await store.put(wallet, WALLET_KEY)
  await Promise.all(LEGACY_KEYS.map((key) => store.delete(key)))
}
