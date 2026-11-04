import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { InlineError } from "@/components/InlineError"
import { EmptyState } from "@/components/EmptyState"
import { filterContacts } from "@/pages/messages/contacts"
import { type Contact } from "@/pages/messages/types"
import type { ComposeState } from "@/pages/messages/hooks/useCompose"
import { ContactRow } from "./ContactRow"

export function RecipientStep({
  compose,
  contacts,
  loading,
  error,
  onRetry,
}: {
  compose: ComposeState
  contacts: Contact[]
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  const filtered = filterContacts(contacts, compose.search)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={compose.search}
            onChange={(e) => compose.setSearch(e.target.value)}
            placeholder="Rechercher un professeur, la vie scolaire…"
            aria-label="Rechercher un destinataire"
            autoFocus
            className="min-h-11 pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Spinner className="size-5" />
            Chargement des destinataires…
          </div>
        ) : error ? (
          <InlineError message={error} onRetry={onRetry} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search01Icon}
            title="Aucun destinataire"
            description={
              compose.search.trim()
                ? `Personne ne correspond à « ${compose.search.trim()} ». Essaie un autre nom.`
                : "Choisis un destinataire pour écrire ton message."
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.slice(0, 60).map((contact) => (
              <ContactRow
                key={`${contact.type}-${contact.id}`}
                contact={contact}
                selected={compose.recipients.some(
                  (r) => r.id === contact.id && r.type === contact.type
                )}
                onToggle={() => compose.toggleRecipient(contact)}
              />
            ))}
            {filtered.length > 60 && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                {filtered.length - 60} autres… affine ta recherche.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          onClick={() => {
            compose.setStep(2)
          }}
          disabled={compose.recipients.length === 0}
          className="min-h-11 w-full"
          size="lg"
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
