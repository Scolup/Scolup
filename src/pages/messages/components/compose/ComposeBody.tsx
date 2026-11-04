import { type Contact } from "@/pages/messages/types"
import type { ComposeState } from "@/pages/messages/hooks/useCompose"
import { ComposeSuccess } from "./ComposeSuccess"
import { RecipientStep } from "./RecipientStep"
import { MessageStep } from "./MessageStep"

export function ComposeBody({
  compose,
  contacts,
  contactsLoading,
  contactsError,
  onRetryContacts,
}: {
  compose: ComposeState
  contacts: Contact[]
  contactsLoading: boolean
  contactsError: string | null
  onRetryContacts: () => void
}) {
  if (compose.sent) return <ComposeSuccess onClose={compose.discardDraft} />
  if (compose.step === 1) {
    return (
      <RecipientStep
        compose={compose}
        contacts={contacts}
        loading={contactsLoading}
        error={contactsError}
        onRetry={onRetryContacts}
      />
    )
  }
  return <MessageStep compose={compose} />
}
