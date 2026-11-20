import type { Litenote, Credentials } from "litenote"
import { studentPortal } from "litenote/host"
import { getDB, getSetting, getSettingSync, setSetting } from "./storage"

const sessionKey = "litenote-session"
let client: Litenote | undefined
let pending: Promise<Litenote | undefined> | undefined
let sessionVersion = 0

export class PronoteConnectionError extends Error {}

function qrConnectionError(
  error: unknown,
  receivedAssociationResponse: boolean
) {
  if (error instanceof PronoteConnectionError) return error
  if (error instanceof Error) {
    switch (error.name) {
      case "BadCredentialsError":
      case "SessionExpiredError":
        return new PronoteConnectionError(
          "Le code à quatre chiffres est incorrect ou le QR a expiré. Génère un nouveau QR dans PRONOTE."
        )
      case "SecurityError":
        return new PronoteConnectionError(
          "PRONOTE exige une vérification supplémentaire pour associer ce compte."
        )
      case "PageUnavailableError":
        return new PronoteConnectionError(
          receivedAssociationResponse
            ? "PRONOTE a ouvert l’espace élève, puis signalé que la page d’association était indisponible."
            : "Scolup n’a pas pu lire la page d’ouverture de l’espace élève PRONOTE."
        )
      case "BusyPageError":
        return new PronoteConnectionError(
          "PRONOTE indique que cet espace est temporairement indisponible."
        )
      case "RateLimitedError":
        return new PronoteConnectionError(
          "PRONOTE a limité les tentatives de connexion. Patiente avant de réessayer."
        )
      case "SuspendedIPError":
        return new PronoteConnectionError(
          "PRONOTE bloque temporairement la connexion depuis le relais Scolup."
        )
      case "AuthenticateError":
      case "ServerSideError":
        return new PronoteConnectionError(
          "PRONOTE a répondu avec une erreur pendant l’association du QR."
        )
      case "AccessDeniedError":
      case "AccountDisabledError":
        return new PronoteConnectionError(
          "PRONOTE refuse l’accès à ce compte. Vérifie que tu peux ouvrir ton espace élève."
        )
    }
  }
  return new PronoteConnectionError(
    "PRONOTE n’a pas pu valider l’association. Génère un nouveau QR dans ton espace élève."
  )
}

export function isPronote() {
  return getSettingSync("school-provider") === "pronote"
}

async function saveSession(credentials: Credentials) {
  await (await getDB()).put("settings", JSON.stringify(credentials), sessionKey)
}

export async function connectPronote(qr: string, pin: string, portal: string) {
  const { Litenote, browserTransport } = await import("litenote")
  let associating = true
  let receivedAssociationResponse = false
  const candidate = new Litenote(async (request) => {
    if (!associating) return browserTransport(request)
    const stage =
      request.method === "POST"
        ? "pendant l’association"
        : "à l’ouverture de PRONOTE"
    try {
      const response = await browserTransport(request)
      receivedAssociationResponse = request.method === "POST"
      return response
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new PronoteConnectionError(
          `Le relais Scolup n’a pas répondu à temps ${stage}.`
        )
      }
      if (error instanceof TypeError) {
        throw new PronoteConnectionError(
          `Le navigateur n’a pas pu joindre le relais Scolup ${stage}.`
        )
      }
      throw new PronoteConnectionError(
        `Le relais Scolup n’a pas accepté la requête ${stage}.`
      )
    }
  })
  const previousAccount = await getSetting("pronote-account")
  const credentials = await candidate
    .connectQr(qr, pin, portal)
    .catch((error) => {
      throw qrConnectionError(error, receivedAssociationResponse)
    })
    .finally(() => {
      associating = false
    })
  await pending?.catch(() => undefined)
  if (!candidate.profile?.id)
    throw new PronoteConnectionError(
      "Le compte élève PRONOTE est indisponible."
    )
  const account = `${studentPortal(portal)}#${candidate.profile.id}`
  if (previousAccount && previousAccount !== account) {
    throw new PronoteConnectionError(
      "Reconnecte le même compte PRONOTE ou déconnecte-toi d’abord de Scolup."
    )
  }
  if (!previousAccount) {
    const { restorePronoteProfile } = await import("./pronoteProfileStorage")
    if (await restorePronoteProfile(account))
      await setSetting("pronote-storage", "local")
  }
  await Promise.all([
    saveSession(credentials),
    setSetting("pronote-account", account),
    setSetting("pronote-portal", studentPortal(portal)),
  ])
  client = candidate
  await setSetting("school-provider", "pronote")
}

export function pronotePortalLink() {
  const value = getSettingSync("pronote-portal")
  try {
    return typeof value === "string" ? studentPortal(value) : undefined
  } catch {
    return undefined
  }
}

export function pronoteProfile() {
  return client?.profile
}

export async function logoutPronote() {
  const account = await getSetting("pronote-account")
  if (typeof account === "string") {
    const { storePronoteProfile } = await import("./pronoteProfileStorage")
    await storePronoteProfile(account)
  }
  sessionVersion++
  client?.logout()
  client = undefined
  await (await getDB()).delete("settings", sessionKey)
}

async function restore(): Promise<Litenote | undefined> {
  if (client?.profile) return client
  const version = sessionVersion
  pending ??= (async () => {
    const raw = await getSetting(sessionKey)
    if (typeof raw !== "string") return
    const { Litenote } = await import("litenote")
    const restored = new Litenote()
    const credentials = await restored.restore(JSON.parse(raw) as Credentials)
    if (version !== sessionVersion) return
    await saveSession(credentials)
    client = restored
    return restored
  })().finally(() => {
    pending = undefined
  })
  return pending
}

export async function loadPronoteSession() {
  return !!(await restore())
}

export async function withPronote<T>(
  read: (client: Litenote) => Promise<T>
): Promise<T> {
  const active = await restore()
  if (!active)
    throw new Error("Reconnecte-toi à PRONOTE depuis les paramètres du compte.")
  try {
    return await read(active)
  } catch (error) {
    const { SessionExpiredError } = await import("litenote")
    if (!(error instanceof SessionExpiredError) || !isPronote()) throw error
    if (client === active) client = undefined
    const restored = await restore()
    if (!restored) throw error
    return read(restored)
  }
}

export function withPronoteSession<T>(
  read: (session: Litenote["active"]) => Promise<T>
): Promise<T> {
  // Litenote 0.1 keeps the Pawnote handle behind a TypeScript-private getter.
  return withPronote((client) => read(client["active"]))
}
