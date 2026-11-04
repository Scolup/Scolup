import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { type Contact } from "../types"
import type { ComposeState } from "../hooks/useCompose"
import { StepDots } from "./compose/StepDots"
import { ComposeBody } from "./compose/ComposeBody"

export function ComposeDrawer({
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
  const subtitle =
    compose.mode === "reply"
      ? compose.replySender
        ? `À ${compose.replySender}`
        : "Réponse"
      : null

  return (
    <Drawer
      open={compose.open}
      onOpenChange={(open) => {
        if (!open) compose.requestClose()
      }}
    >
      <DrawerContent>
        <div className="flex shrink-0 items-center gap-2 border-b border-border p-4 pb-[calc(1rem+env(safe-area-inset-top))]">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fermer la rédaction"
            className="min-h-11 min-w-11"
            onClick={compose.requestClose}
            disabled={compose.sending}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-base font-semibold text-card-foreground">
              {compose.mode === "reply" ? "Répondre" : "Nouveau message"}
            </span>
            {compose.mode === "new" && <StepDots step={compose.step} />}
            {subtitle && (
              <span className="truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <ComposeBody
          compose={compose}
          contacts={contacts}
          contactsLoading={contactsLoading}
          contactsError={contactsError}
          onRetryContacts={onRetryContacts}
        />
      </DrawerContent>
    </Drawer>
  )
}
