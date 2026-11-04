import { ld } from "./litedirecte"

export function accountDisplayName(): string {
  const account = ld.auth.getAccount()
  return account ? `${account.prenom ?? ""} ${account.nom ?? ""}`.trim() : ""
}
