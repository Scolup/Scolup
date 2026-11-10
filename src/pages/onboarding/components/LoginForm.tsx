import { Link } from "react-router"
import { m, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { FieldDescription } from "@/components/ui/field"
import { HugeiconsIcon } from "@hugeicons/react"
import { Login01Icon } from "@hugeicons/core-free-icons"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { useLogin } from "../hooks/useLogin"
import { SubmitButton } from "./login/SubmitButton"
import { CredentialsForm } from "./login/CredentialsForm"
import { TwoFactorForm } from "./login/TwoFactorForm"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onNext?: () => void
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
