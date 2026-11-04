// Console command available in production: `__giveRubis()`.
// The PIN is chosen once per device and only a salted hash is stored locally,
// so it never appears in the code or the bundle. The write goes through the
// same DB + notify path as the app, so the balance updates live everywhere
// (header pill, shop, rubis page) and is pushed to the cloud.
import {
  createPinHash,
  isPinFormat,
  matchesPin,
  type StoredPin,
} from "@/lib/pin"
import { reloadRubies, RUBIES_KEY } from "@/features/shop/rubies"
import { getDB } from "@/services/storage"
import { triggerCloudSync } from "@/services/cloudSync"

// No "scolup:" prefix: cloudSync only syncs those keys, and the PIN must stay
// on this device.
const PIN_KEY = "scolup-rubis-pin"

function readStoredPin(): StoredPin | null {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "salt" in parsed &&
      typeof parsed.salt === "string" &&
      "hash" in parsed &&
      typeof parsed.hash === "string"
    ) {
      return { salt: parsed.salt, hash: parsed.hash }
    }
  } catch {
    // Stockage indisponible ou corrompu : on considère qu'aucun PIN n'existe.
  }
  return null
}

function saveStoredPin(stored: StoredPin): void {
  localStorage.setItem(PIN_KEY, JSON.stringify(stored))
}

async function askPin(): Promise<boolean> {
  const stored = readStoredPin()
  if (!stored) {
    const pin = window.prompt(
      "Aucun code PIN configuré. Choisis un code à 6 chiffres :"
    )
    if (pin === null) return false
    if (!isPinFormat(pin)) {
      console.error("[rubis] Le code PIN doit faire 6 chiffres.")
      return false
    }
    const confirmation = window.prompt("Confirme le code PIN :")
    if (confirmation !== pin) {
      console.error("[rubis] Les deux codes ne correspondent pas.")
      return false
    }
    saveStoredPin(await createPinHash(pin))
    return true
  }
  const pin = window.prompt("Code PIN à 6 chiffres :")
  if (pin === null) return false
  if (!(await matchesPin(pin, stored))) {
    console.error("[rubis] Code PIN incorrect.")
    return false
  }
  return true
}

async function addRubies(amount: number): Promise<number> {
  const db = await getDB()
  const current = Number((await db.get("shop", RUBIES_KEY)) ?? 0)
  const next = Math.max(0, Math.trunc(current) + amount)
  await db.put("shop", next, RUBIES_KEY)
  await reloadRubies()
  triggerCloudSync()
  return next
}

async function giveRubies(): Promise<number | null> {
  if (!(await askPin())) return null
  const raw = window.prompt("Nombre de rubis à ajouter :")
  if (raw === null) return null
  const amount = Number(raw.trim())
  if (!Number.isInteger(amount) || amount <= 0) {
    console.error("[rubis] Montant invalide.")
    return null
  }
  const next = await addRubies(amount)
  console.info(`[rubis] +${amount} rubis. Nouveau solde : ${next}.`)
  return next
}

;(
  window as unknown as { __giveRubis?: () => Promise<number | null> }
).__giveRubis = giveRubies
