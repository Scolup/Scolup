import { EdError } from "litedirecte"
import { reportApiError } from "./apiErrorStore"

// Codes numériques qui ont déjà leur propre traitement : 2FA, identifiants,
// session expirée (gérée par Litedirecte + la feuille de reconnexion), absence
// de données. Les codes internes du SDK ne sont pas numériques et passent donc
// déjà à côté du mécanisme ci-dessous.
const EXPECTED_CODES = new Set([
  "202", // premier login
  "210", // aucune donnée d'absence
  "240", // charte à accepter
  "250", // double authentification
  "505", // identifiants incorrects
  "520", // jeton invalide
  "521", // re-login nécessaire
  "522", // en-têtes invalides
  "525", // jeton manquant
  "526", // renouvellement expiré
])

export function isUnexpectedApiError(err: unknown): err is EdError {
  return (
    err instanceof EdError &&
    /^\d+$/.test(err.code) &&
    !EXPECTED_CODES.has(err.code)
  )
}

export function reportUnexpectedApiError(err: EdError): void {
  const raw = (err.raw as { message?: unknown } | null)?.message
  reportApiError({
    code: err.code,
    description:
      typeof raw === "string" && raw.trim()
        ? raw
        : err.message || "Une erreur inattendue est survenue.",
  })
}
