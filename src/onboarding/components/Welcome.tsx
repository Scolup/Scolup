import { useState } from "react"
import { useNavigate } from "react-router"
import { m, type Variants } from "motion/react"
import { cn } from "@/lib/utils"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Notebook01Icon,
  Chart03Icon,
  Comment03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { completeOnboarding } from "@/services/onboarding"

const FEATURES = [
  {
    label: "Suis ta progression au fil de l'année",
    icon: Chart03Icon,
  },
  {
    label: "Organise mieux ton temps",
    icon: Notebook01Icon,
  },
  {
    label: "Ne rate plus un message de l'école",
    icon: Comment03Icon,
  },
] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.13, delayChildren: 0.3 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.15, 1] },
  },
}

interface WelcomeProps extends React.ComponentProps<"div"> {
  onNext?: () => void
}

export function Welcome({ className }: WelcomeProps) {
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)

  const handleOpen = async () => {
    if (opening) return
    setOpening(true)
    await completeOnboarding()
    navigate("/")
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[80dvh] flex-col items-center justify-center overflow-hidden px-6 py-12",
        className
      )}
    >
      <m.div
        className="relative z-10 flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <m.div variants={itemVariants}>
          <m.div
            className="flex size-20 items-center justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="/logos/logo.svg"
              alt="Scolup"
              className="size-full dark:invert"
            />
          </m.div>
        </m.div>

        <m.div
          variants={itemVariants}
          className="flex flex-col items-center gap-3 text-center"
        >
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            C&apos;est parti !
          </h1>
          <p className="max-w-[20ch] text-base text-muted-foreground">
            Ton année scolaire, simplifiée.
          </p>
        </m.div>

        <m.div variants={itemVariants} className="flex w-full flex-col">
          <ItemGroup>
            {FEATURES.map((feature) => (
              <Item key={feature.label} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <HugeiconsIcon
                    icon={feature.icon}
                    strokeWidth={1.5}
                    className="size-5 text-primary-text"
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{feature.label}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </m.div>

        <m.div
          variants={itemVariants}
          className="w-full"
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            className="relative w-full overflow-hidden disabled:cursor-not-allowed"
            size="lg"
            onClick={handleOpen}
            disabled={opening}
          >
            {opening ? (
              <m.span
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <m.span
                  className="inline-block size-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                Ouverture…
              </m.span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                Ouvrir
              </span>
            )}
          </Button>
        </m.div>
      </m.div>
    </div>
  )
}
