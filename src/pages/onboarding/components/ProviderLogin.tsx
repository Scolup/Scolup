import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AnimatePresence, m, useIsPresent } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { GridViewIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PronoteStorageOptions } from "@/components/PronoteStorageOptions"
import { getSettingSync, setSetting } from "@/services/storage"
import { isPronote } from "@/services/litenote"
import { fadeUp, SPRING_POP, staggerContainer } from "@/lib/motion"
import type { LoginService } from "../hooks/useOnboardingNavigation"
import { pageTransitionVariants } from "@/lib/onboardingTransitions"
import { OnboardingConfirmButton } from "./OnboardingConfirmButton"

const EcoleDirecte = lazy(() =>
  import("./LoginForm").then((m) => ({ default: m.LoginForm }))
)
const Pronote = lazy(() =>
  import("@/components/pronote/PronoteLogin").then((m) => ({
    default: m.PronoteLogin,
  }))
)
const providers = [
  {
    service: "ecoledirecte",
    name: "ÉcoleDirecte",
    logo: "/logos/ecoledirecte.svg",
  },
  { service: "pronote", name: "PRONOTE", logo: "/logos/pronote.svg" },
] as const
const hasStorage = () => getSettingSync("pronote-storage") === "local"

export function ProviderLogin({
  onNext,
  service,
  onSelectService,
}: {
  onNext: () => void
  service: LoginService | null
  onSelectService: (service: LoginService | null) => void
}) {
  const [associated, setAssociated] = useState(isPronote)
  const [selectedService, setSelectedService] = useState<LoginService | null>(
    null
  )
  const [confirmed, setConfirmed] = useState(false)
  const serviceTimer = useRef<number | undefined>(undefined)
  const isPresent = useIsPresent()
  const saving = useRef(false)
  const [error, setError] = useState(false)
  const step = associated
    ? hasStorage()
      ? "connected"
      : "storage"
    : (service ?? "choose")
  const direction = step === "choose" ? -1 : 1
  const selectedProvider = providers.find(
    (provider) => provider.service === selectedService
  )

  useEffect(() => {
    if (!isPresent) window.clearTimeout(serviceTimer.current)
    return () => window.clearTimeout(serviceTimer.current)
  }, [isPresent])

  function confirmService() {
    if (!selectedService || serviceTimer.current !== undefined) return
    setConfirmed(true)
    serviceTimer.current = window.setTimeout(() => {
      serviceTimer.current = undefined
      setConfirmed(false)
      setSelectedService(null)
      onSelectService(selectedService)
    }, 500)
  }

  async function saveLocal() {
    if (saving.current) return
    saving.current = true
    try {
      await setSetting("pronote-storage", "local")
      onNext()
    } catch {
      setError(true)
    } finally {
      saving.current = false
    }
  }

  let screen: ReactNode
  if (step === "storage") {
    screen = (
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Où garder tes données Scolup ?</h1>
        <PronoteStorageOptions
          selected={false}
          onLocal={() => void saveLocal()}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            Le stockage local est indisponible.
          </p>
        )}
      </section>
    )
  } else if (step === "connected") {
    screen = (
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Ton compte PRONOTE est associé</h1>
        <Button className="min-h-11" onClick={onNext}>
          Continuer
        </Button>
      </section>
    )
  } else if (step === "choose") {
    screen = (
      <m.section
        className="flex flex-col gap-6 pb-6 sm:pb-8"
        variants={staggerContainer(0.1, 0.1)}
        initial="hidden"
        animate="visible"
      >
        <m.div
          variants={fadeUp()}
          className="flex flex-col items-center gap-4 text-center"
        >
          <span className="grid size-8 place-items-center">
            <HugeiconsIcon
              icon={GridViewIcon}
              strokeWidth={2}
              className="size-6"
              aria-hidden="true"
            />
          </span>
          <h1 className="text-xl font-bold">Quel service utilises-tu ?</h1>
        </m.div>
        <m.div
          variants={fadeUp()}
          className="flex justify-center gap-5 sm:gap-8"
        >
          {providers.map((provider) => (
            <div
              key={provider.service}
              className="flex flex-col items-center gap-3 px-2"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={provider.name}
                aria-pressed={selectedService === provider.service}
                disabled={confirmed}
                className="relative size-24 rounded-full bg-card hover:border-primary/50 hover:bg-primary/5 disabled:opacity-100 aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 sm:size-28 dark:bg-card dark:hover:bg-primary/5"
                onClick={() => setSelectedService(provider.service)}
              >
                <img
                  src={provider.logo}
                  alt=""
                  width={24}
                  height={25}
                  className="size-14 object-contain sm:size-16 dark:invert"
                />
                {selectedService === provider.service && (
                  <m.span
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 grid size-4.5 place-items-center rounded-full border-2 border-background bg-neutral-800 text-white"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING_POP}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3"
                    >
                      <m.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                      />
                    </svg>
                  </m.span>
                )}
              </Button>
              <span className="text-sm font-semibold" aria-hidden="true">
                {provider.name}
              </span>
            </div>
          ))}
        </m.div>
        <OnboardingConfirmButton
          label={
            selectedProvider
              ? `J’utilise ${selectedProvider.name}`
              : "J’utilise…"
          }
          confirmed={confirmed}
          disabled={!selectedProvider}
          onClick={confirmService}
        />
      </m.section>
    )
  } else {
    screen = (
      <Suspense fallback={<Spinner className="mx-auto" />}>
        {step === "ecoledirecte" ? (
          <EcoleDirecte onNext={onNext} />
        ) : (
          <Pronote
            onNext={() => {
              if (hasStorage()) onNext()
              else {
                setAssociated(true)
                onSelectService(null)
              }
            }}
          />
        )}
      </Suspense>
    )
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <m.div
        key={step}
        custom={direction}
        variants={pageTransitionVariants}
        initial={step === "choose" ? false : "initial"}
        animate="animate"
        exit="exit"
      >
        {screen}
      </m.div>
    </AnimatePresence>
  )
}
