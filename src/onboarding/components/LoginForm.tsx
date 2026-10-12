import type { FormEvent, ReactNode } from "react"
import { Link } from "react-router"
import { m, AnimatePresence } from "motion/react"
import type { LoginChallenge } from "lowdirecte"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import { Login01Icon, EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons"
import { fadeUp, staggerContainer } from "@/hooks/use-micro-interactions"
import { useLogin } from "@/onboarding/hooks/useLogin"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onNext?: () => void
}

interface ErrorBannerProps {
  error: string | null
  errorKey: number
  errorShake: boolean
}

function ErrorBanner({ error, errorKey, errorShake }: ErrorBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <m.div
          key={errorKey}
          initial={{ opacity: 0, y: -8 }}
          animate={{
            opacity: 1,
            y: 0,
            x: errorShake ? [0, -6, 6, -4, 4, 0] : 0,
          }}
          transition={{
            duration: errorShake ? 0.4 : 0.2,
            ease: "easeOut",
          }}
        >
          <FieldError>{error}</FieldError>
        </m.div>
      )}
    </AnimatePresence>
  )
}

interface CredentialsFormProps extends ErrorBannerProps {
  showPassword: boolean
  onTogglePassword: () => void
  onSubmit: (event: FormEvent) => void
  children?: ReactNode
}

function CredentialsForm({
  showPassword,
  onTogglePassword,
  onSubmit,
  children,
  ...error
}: CredentialsFormProps) {
  return (
    <m.form
      key="credentials"
      variants={fadeUp()}
      id="login-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-3"
    >
      <Field>
        <FieldLabel htmlFor="identifier">Identifiant</FieldLabel>
        <div className="origin-left">
          <Input
            id="identifier"
            name="identifier"
            type="text"
            placeholder="Lori Dupont"
            required
            autoComplete="username"
          />
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
        <div className="origin-left">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <m.button
              type="button"
              onClick={onTogglePassword}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
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
            </m.button>
          </div>
        </div>
      </Field>

      <ErrorBanner {...error} />

      {children}
    </m.form>
  )
}

interface TwoFactorFormProps extends ErrorBannerProps {
  challenge: LoginChallenge
  selectedChoice: number | null
  submitting: boolean
  onAnswer: (index: number) => void
  onBack: () => void
}

function TwoFactorForm({
  challenge,
  selectedChoice,
  submitting,
  onAnswer,
  onBack,
  ...error
}: TwoFactorFormProps) {
  return (
    <m.div key="2fa" variants={fadeUp()} className="flex flex-col gap-3">
      <p className="text-center text-sm font-medium">{challenge.question}</p>

      <div className="flex flex-col gap-2">
        {challenge.choices.map((choice, index) => (
          <m.div
            key={choice}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant={selectedChoice === index ? "default" : "outline"}
              disabled={submitting}
              onClick={() => onAnswer(index)}
              className={cn(
                "w-full justify-start text-left text-sm",
                selectedChoice === index && "pointer-events-none"
              )}
            >
              {choice}
            </Button>
          </m.div>
        ))}
      </div>

      <ErrorBanner {...error} />

      <m.button
        type="button"
        className="mt-2 cursor-pointer text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary-text"
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={onBack}
      >
        Retour aux identifiants
      </m.button>
    </m.div>
  )
}

function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <Button
      type="submit"
      disabled={submitting}
      className="relative overflow-hidden disabled:cursor-not-allowed"
    >
      {submitting ? (
        <span className="flex items-center gap-2">
          <m.span
            className="inline-block size-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          Connexion…
        </span>
      ) : (
        "Se connecter"
      )}
    </Button>
  )
}

function Header({ isTwoFactor }: { isTwoFactor: boolean }) {
  return (
    <m.div
      variants={fadeUp()}
      className="flex flex-col items-center gap-4 text-center"
    >
      <div className="flex size-8 items-center justify-center rounded-md">
        <HugeiconsIcon icon={Login01Icon} strokeWidth={2} className="size-6" />
      </div>
      <span className="sr-only">Scolup</span>

      <h1 className="text-xl font-bold">
        {isTwoFactor
          ? "Vérification de sécurité"
          : "Connecte-toi à ton compte EcoleDirecte."}
      </h1>

      <FieldDescription>
        {isTwoFactor ? (
          "Choisis la bonne réponse pour confirmer ton identité."
        ) : (
          <>
            Tu as oublié ton mot de passe ?{" "}
            <a href="https://api.ecoledirecte.com/mot-de-passe-oublie.awp">
              Retrouver mon compte
            </a>
          </>
        )}
      </FieldDescription>
    </m.div>
  )
}

function LegalNotice() {
  return (
    <m.p
      variants={fadeUp()}
      className="px-6 text-center text-sm leading-normal font-normal text-muted-foreground"
    >
      En continuant, tu acceptes nos{" "}
      <Link
        to="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-primary-text"
      >
        Conditions d'utilisation
      </Link>{" "}
      et notre{" "}
      <Link
        to="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-primary-text"
      >
        Politique de confidentialité
      </Link>
      .<br />{" "}
      <em>Si tu as moins de 15 ans, demande à tes parents ou tuteurs.</em>
    </m.p>
  )
}

export function LoginForm({ className, onNext }: LoginFormProps) {
  const login = useLogin(onNext)
  const error = {
    error: login.error,
    errorKey: login.errorKey,
    errorShake: login.errorShake,
  }

  if (!login.ready) return null

  return (
    <m.div
      className={cn("flex flex-col gap-6", className)}
      variants={staggerContainer(0.08, 0.1)}
      initial="hidden"
      animate="visible"
    >
      <Header isTwoFactor={login.phase === "2fa"} />

      <AnimatePresence mode="wait">
        {login.phase === "credentials" ? (
          <CredentialsForm
            showPassword={login.showPassword}
            onTogglePassword={login.togglePassword}
            onSubmit={login.submit}
            {...error}
          >
            <m.div
              variants={fadeUp()}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex flex-col gap-3"
            >
              <SubmitButton submitting={login.submitting} />
            </m.div>
          </CredentialsForm>
        ) : login.challenge ? (
          <TwoFactorForm
            challenge={login.challenge}
            selectedChoice={login.selectedChoice}
            submitting={login.submitting}
            onAnswer={login.answer}
            onBack={login.backToCredentials}
            {...error}
          />
        ) : null}
      </AnimatePresence>

      <LegalNotice />
    </m.div>
  )
}
