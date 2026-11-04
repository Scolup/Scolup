import { ld } from "@/services/litedirecte"
import { MESSAGE_YEAR } from "./schoolYear"
import { toMessage } from "./mappers"
import type { Message, MessageEntry } from "./types"

// Les messages reçus de l'année scolaire en cours (utilisé par l'accueil).
export async function fetchInbox(): Promise<Message[]> {
  if (!(await ld.auth.loadSession())) throw new Error("no session")
  const result = await ld.messages.getMessages({ year: MESSAGE_YEAR })
  const received = (result.messages as { received?: MessageEntry[] })?.received
  return (Array.isArray(received) ? received : []).map(toMessage)
}
