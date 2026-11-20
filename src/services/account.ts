import { isPronote, pronoteProfile } from "./litenote"
import { ld } from "./litedirecte"

export function accountDisplayName(): string {
  if (isPronote()) return pronoteProfile()?.name ?? ""
  const account = ld.auth.getAccount()
  return account ? `${account.prenom ?? ""} ${account.nom ?? ""}`.trim() : ""
}
