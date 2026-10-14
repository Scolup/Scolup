"use client"

import { useRef } from "react"
import { m, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  Attachment01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import { avatarTint, cn, initialsFromName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { InlineError } from "@/ui/inline-error"
import { EmptyState } from "@/ui/empty-state"
import {
  EASE_OUT,
  fadeUp,
  staggerContainer,
} from "@/hooks/use-micro-interactions"
import {
  contactTypeLabel,
  filterContacts,
  MAX_SUBJECT_LENGTH,
  type Contact,
} from "../helpers"
import type { ComposeState } from "../hooks/useCompose"

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span
        className={cn(
          "h-1.5 rounded-full transition-all",
          step === 1 ? "w-6 bg-primary" : "w-3 bg-primary/30"
        )}
      />
      <span
        className={cn(
          "h-1.5 rounded-full transition-all",
          step === 2 ? "w-6 bg-primary" : "w-3 bg-primary/30"
        )}
      />
    </div>
  )
}

function ContactRow({
  contact,
  selected,
  onToggle,
}: {
  contact: Contact
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-primary/40 bg-primary/10"
          : "border-border/60 bg-input/50 active:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          avatarTint(contact.name)
        )}
        aria-hidden="true"
      >
        {initialsFromName(contact.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-card-foreground">
          {contact.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {contactTypeLabel(contact.type)}
          {contact.detail ? ` · ${contact.detail}` : ""}
        </span>
      </span>
      <m.span
        aria-hidden="true"
        initial={{ scale: 1 }}
        animate={selected ? { scale: [0.4, 1] } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent"
        )}
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
      </m.span>
    </button>
  )
}

function ComposeSuccess({ onClose }: { onClose: () => void }) {
  return (
    <m.div
      variants={staggerContainer(0.09, 0.05)}
      initial="hidden"
      animate="visible"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto p-6 text-center"
    >
      <m.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 19 }}
        className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          aria-hidden="true"
        >
          <m.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.12 }}
          />
        </svg>
      </m.span>
      <m.p
        variants={fadeUp(10, 0.35)}
        className="text-lg font-semibold text-card-foreground"
      >
        Message envoyé
      </m.p>
      <m.p
        variants={fadeUp(10, 0.35)}
        className="max-w-xs text-sm text-muted-foreground"
      >
        Ton message est parti. Tu le retrouveras dans tes envoyés après
        synchronisation.
      </m.p>
      <m.div variants={fadeUp(10, 0.35)}>
        <Button onClick={onClose} className="mt-2 min-h-11 px-6" size="lg">
          Fermer
        </Button>
      </m.div>
    </m.div>
  )
}

function DiscardConfirm({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void
  onDiscard: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <HugeiconsIcon icon={AlertCircleIcon} className="size-7" />
      </span>
      <p className="text-lg font-semibold text-card-foreground">
        Abandonner ce brouillon&nbsp;?
      </p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Tes destinataires, l'objet et le message seront perdus.
      </p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <Button onClick={onKeep} className="min-h-11 w-full" size="lg">
          Continuer la rédaction
        </Button>
        <Button
          variant="destructive"
          onClick={onDiscard}
          className="min-h-11 w-full"
          size="lg"
        >
          Tout abandonner
        </Button>
      </div>
    </div>
  )
}

function RecipientStep({
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
        {compose.recipients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {compose.recipients.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => compose.removeRecipient(r)}
                aria-label={`Retirer ${r.name}`}
                className="flex min-h-11 items-center gap-1.5 rounded-full bg-primary/10 py-1 pr-2 pl-3 text-sm font-medium text-primary-text active:bg-primary/20"
              >
                {r.name}
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            ))}
          </div>
        )}

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

function MessageStep({ compose }: { compose: ComposeState }) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const focusBody = compose.mode === "reply"

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        void compose.send()
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {compose.mode === "new" && (
          <button
            type="button"
            onClick={() => compose.setStep(1)}
            className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-border/60 bg-input/50 px-3 text-left text-sm"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 flex-1 truncate">
              À :{" "}
              <strong>
                {compose.recipients.map((r) => r.name).join(", ")}
              </strong>
            </span>
            <span className="shrink-0 text-xs font-medium text-primary-text">
              Modifier
            </span>
          </button>
        )}

        <div
          className={cn(
            "flex items-baseline justify-between gap-2",
            compose.mode === "new" && "pt-4"
          )}
        >
          <label
            htmlFor="compose-subject"
            className="pb-1.5 text-sm font-medium text-card-foreground"
          >
            Objet
          </label>
          {compose.subject.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {compose.subject.length}/{MAX_SUBJECT_LENGTH}
            </span>
          )}
        </div>
        <Input
          id="compose-subject"
          value={compose.subject}
          onChange={(e) => compose.setSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              bodyRef.current?.focus()
            }
          }}
          placeholder="Ex : Absence du 12 octobre"
          autoFocus={!focusBody}
          className="min-h-11"
          maxLength={MAX_SUBJECT_LENGTH}
        />

        <label
          htmlFor="compose-body"
          className="block pt-4 pb-1.5 text-sm font-medium text-card-foreground"
        >
          Message
        </label>
        <Textarea
          id="compose-body"
          ref={bodyRef}
          value={compose.content}
          onChange={(e) => compose.setContent(e.target.value)}
          placeholder="Bonjour,…"
          autoFocus={focusBody}
          className="min-h-44"
          rows={10}
        />

        <input
          ref={fileRef}
          type="file"
          multiple
          aria-hidden="true"
          tabIndex={-1}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) compose.addAttachments(e.target.files)
            e.target.value = ""
          }}
        />
        {compose.attachments.length > 0 && (
          <ul
            className="flex flex-col gap-1.5 pt-3"
            aria-label="Pièces jointes"
          >
            {compose.attachments.map((file, i) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/60 bg-input/50 px-3 text-sm"
              >
                <HugeiconsIcon
                  icon={Attachment01Icon}
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => compose.removeAttachment(i)}
                  disabled={compose.sending}
                  aria-label={`Retirer ${file.name}`}
                  className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={compose.sending}
            className="min-h-11 w-full"
            size="lg"
          >
            <HugeiconsIcon
              icon={Attachment01Icon}
              className="size-4"
              aria-hidden="true"
            />
            Joindre un fichier
          </Button>
          <Button
            type="submit"
            disabled={compose.sending}
            className="min-h-11 w-full"
            size="lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={compose.sending ? "sending" : "idle"}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                className="flex items-center gap-1.5"
              >
                {compose.sending ? (
                  <>
                    <Spinner className="size-4 border-primary-foreground border-t-transparent" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={SentIcon}
                      className="size-4"
                      aria-hidden="true"
                    />
                    Envoyer
                  </>
                )}
              </m.span>
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </form>
  )
}

function ComposeBody({
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
  if (compose.confirmingClose)
    return (
      <DiscardConfirm
        onKeep={compose.cancelClose}
        onDiscard={compose.discardDraft}
      />
    )
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
      <DrawerContent className="flex max-h-[92dvh] flex-col overflow-hidden p-0">
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
