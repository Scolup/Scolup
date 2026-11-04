import type { FormEvent, ReactNode } from "react"
import { m } from "motion/react"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons"
import { fadeUp } from "@/lib/motion"
import { type ErrorBannerProps, ErrorBanner } from "./ErrorBanner"

interface CredentialsFormProps extends ErrorBannerProps {
  showPassword: boolean
  onTogglePassword: () => void
  onSubmit: (event: FormEvent) => void
  children?: ReactNode
}

export function CredentialsForm({
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
