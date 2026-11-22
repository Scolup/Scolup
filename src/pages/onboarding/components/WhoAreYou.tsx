import { useState } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  StudentIcon,
  TeacherIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { getSettingSync, setSetting } from "@/services/storage"

const PROFILES = [
  { value: "student", label: "Élève", icon: StudentIcon },
  { value: "parent", label: "Parent", icon: UserGroupIcon },
  { value: "teacher", label: "Professeur", icon: TeacherIcon },
] as const

type UserType = (typeof PROFILES)[number]["value"]
type Notice = { title: string; message: string }

const NOTICES: Partial<Record<UserType, Notice>> = {
  parent: {
    title: "Compte parent",
    message:
      "Les comptes parent seront bientôt ajoutés à Scolup. En attendant, vous devrez rester sur EcoleDirecte.",
  },
  teacher: {
    title: "Compte professeur",
    message: "Les comptes professeur ne sont pas encore disponibles. Désolé 😅",
  },
}

function savedProfile(): UserType | null {
  const saved = getSettingSync("userType")
  return PROFILES.find((profile) => profile.value === saved)?.value ?? null
}

interface WhoAreYouProps extends React.ComponentProps<"div"> {
  onNext?: () => void
}

export function WhoAreYou({ className, onNext }: WhoAreYouProps) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const selected = savedProfile()

  const handlePick = async (profile: (typeof PROFILES)[number]) => {
    const unavailable = NOTICES[profile.value]
    if (unavailable) {
      setNotice(unavailable)
      return
    }
    await setSetting("userType", profile.value)
    onNext?.()
  }

  return (
    <>
      <m.div
        className={cn("flex flex-col gap-6", className)}
        variants={staggerContainer(0.1, 0.1)}
        initial="hidden"
        animate="visible"
      >
        <m.div
          variants={fadeUp()}
          className="flex flex-col items-center gap-2 text-center"
        >
          <h1 className="text-xl font-bold">Qui es-tu ?</h1>
          <p className="text-sm text-muted-foreground">
            Choisis le profil qui te correspond.
          </p>
        </m.div>

        <m.div variants={fadeUp()}>
          <div
            role="radiogroup"
            aria-label="Profil"
            className="grid grid-cols-3 gap-2"
          >
            {PROFILES.map((profile) => {
              const active = profile.value === selected
              return (
                <button
                  key={profile.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => void handlePick(profile)}
                  className={cn(
                    "flex min-h-24 press flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "border-transparent bg-accent text-foreground"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  <HugeiconsIcon
                    icon={profile.icon}
                    strokeWidth={1.5}
                    className="size-6"
                  />
                  <span className="text-sm font-medium">{profile.label}</span>
                </button>
              )
            })}
          </div>
        </m.div>
      </m.div>

      <Dialog
        open={notice !== null}
        onOpenChange={(open) => {
          if (!open) setNotice(null)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{notice?.title}</DialogTitle>
            <DialogDescription>{notice?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button className="w-full" />}>
              Compris
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
