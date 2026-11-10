// PIN hashing for the `__giveRubis()` console command. The PIN itself never
// lives in the bundle: only a salted PBKDF2 hash is kept on the device.

const ITERATIONS = 150_000
const SALT_BYTES = 16

export interface StoredPin {
  salt: string
  hash: string
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function hash(
  pin: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256
  )
  return toBase64(new Uint8Array(bits))
}

export function isPinFormat(value: string): boolean {
  return /^\d{6}$/.test(value)
}

export async function createPinHash(pin: string): Promise<StoredPin> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  return { salt: toBase64(salt), hash: await hash(pin, salt) }
}

export async function matchesPin(
  pin: string,
  stored: StoredPin
): Promise<boolean> {
  return (await hash(pin, fromBase64(stored.salt))) === stored.hash
}
