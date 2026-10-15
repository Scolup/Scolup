import { m, AnimatePresence } from "motion/react"
import type { LoginChallenge } from "lowdirecte"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { fadeUp } from "@/hooks/use-micro-interactions"
import { useReauth, type ReauthModel } from "@/hooks/use-reauth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"

function CredentialsForm({
  identifier,
  showPassword,
  submitting,
  error,
  togglePassword: onTogglePassword,
  submit: onSubmit,
}: Pick<
  ReauthModel,
  | "identifier"
  | "showPassword"
  | "submitting"
  | "error"
  | "togglePassword"
  | "submit"
>) {
  return (
    <m.form
      key="credentials"
      variants={fadeUp()}
      initial="hidden"
      animate="visible"
      onSubmit={onSubmit}
      className="flex flex-col gap-3"
    >
      <Field>
        <FieldLabel htmlFor="reauth-identifier">Identifiant</FieldLabel>
        <Input
          id="reauth-identifier"
          name="identifier"
          type="text"
          placeholder="Lori Dupont"
          defaultValue={identifier}
          required
          autoComplete="username"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="reauth-password">Mot de passe</FieldLabel>
        <div className="relative">
          <Input
            id="reauth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            aria-pressed={showPassword}
          >
            <HugeiconsIcon
              icon={showPassword ? EyeOffIcon : EyeIcon}
              strokeWidth={1.5}
              className="size-4"
            />
          </button>
        </div>
      </Field>

      {error && <FieldError>{error}</FieldError>}

      <Button
        type="submit"
        disabled={submitting}
        className="mt-1 min-h-11 w-full"
      >
        {submitting ? (
          <>
            <Spinner className="size-4 border-current border-t-transparent" />
            Connexion…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </m.form>
  )
}

function TwoFactorForm({
  challenge,
  selectedChoice,
  submitting,
  error,
  answer: onAnswer,
  backToCredentials: onBack,
}: {
  challenge: LoginChallenge
  selectedChoice: number | null
  submitting: boolean
  error: string | null
  answer: (index: number) => void
  backToCredentials: () => void
}) {
  return (
    <m.div
      key="2fa"
      variants={fadeUp()}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
    >
      <p className="text-center text-sm font-medium">{challenge.question}</p>

      <div className="flex flex-col gap-2">
        {challenge.choices.map((choice, index) => (
          <Button
            key={choice}
            variant={selectedChoice === index ? "default" : "outline"}
            disabled={submitting}
            onClick={() => onAnswer(index)}
            className={cn(
              "min-h-11 w-full justify-start text-left text-sm",
              selectedChoice === index && "pointer-events-none"
            )}
          >
            {choice}
          </Button>
        ))}
      </div>

      {error && <FieldError>{error}</FieldError>}

      <button
        type="button"
        className="mt-1 cursor-pointer text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary-text"
        onClick={onBack}
      >
        Retour aux identifiants
      </button>
    </m.div>
  )
}

function ReauthForms(props: ReauthModel) {
  return (
    <AnimatePresence mode="wait">
      {props.phase === "credentials" ? (
        <CredentialsForm {...props} />
      ) : props.challenge ? (
        <TwoFactorForm {...props} challenge={props.challenge} />
      ) : null}{" "}
    </AnimatePresence>
  )
}

function HeaderIcon() {
  return (
    <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
      <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="size-5" />
    </div>
  )
}

function LogoutButton({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 w-full text-muted-foreground"
    >
      Se déconnecter
    </Button>
  )
}

/**
 * Re-authentication surface shown when the EcoleDirecte session cannot be
 * refreshed. Mobile gets a bottom drawer, desktop a dialog; both are
 * intentionally non-dismissible — the only way out is logging in or out.
 */
export function ReauthSheet() {
  const reauth = useReauth()
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (!reauth.required) return null

  if (isDesktop) {
    return (
      <Dialog open disablePointerDismissal onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="gap-5">
          <DialogHeader className="items-center gap-3 text-center">
            <HeaderIcon />
            <div className="flex flex-col gap-1">
              <DialogTitle>Session expirée</DialogTitle>
              <DialogDescription>
                Reconnecte-toi pour continuer à utiliser Scolup.
              </DialogDescription>
            </div>
          </DialogHeader>

          <ReauthForms {...reauth} />
          <LogoutButton disabled={reauth.submitting} onClick={reauth.logout} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open dismissible={false} onOpenChange={() => {}}>
      <DrawerContent className="[&>div:first-child]:hidden">
        <div className="flex flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col items-center gap-3 text-center">
            <HeaderIcon />
            <div className="flex flex-col gap-1">
              <DrawerTitle>Session expirée</DrawerTitle>
              <DrawerDescription>
                Reconnecte-toi pour continuer à utiliser Scolup.
              </DrawerDescription>
            </div>
          </div>

          <ReauthForms {...reauth} />

          <LogoutButton disabled={reauth.submitting} onClick={reauth.logout} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
