import { HugeiconsIcon } from "@hugeicons/react"
import {
  InformationCircleIcon,
  LogOutIcon,
  Settings02Icon,
  SproutIcon,
} from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { avatarTint, cn } from "@/lib/utils"
import { AboutDialog } from "./AboutDialog"
import { FeedbackDialog } from "./FeedbackDialog"
import { useFeedback } from "../hooks/useFeedback"

export function AccountMenu({
  photo,
  displayName,
  initials,
  loggingOut,
  confirmOpen,
  aboutOpen,
  onSettings,
  onAskLogout,
  onAskAbout,
  onLogout,
  onConfirmOpenChange,
  onAboutOpenChange,
}: {
  photo: string | null
  displayName: string
  initials: string
  loggingOut: boolean
  confirmOpen: boolean
  aboutOpen: boolean
  onSettings: () => void
  onAskLogout: () => void
  onAskAbout: () => void
  onLogout: () => void
  onConfirmOpenChange: (open: boolean) => void
  onAboutOpenChange: (open: boolean) => void
}) {
  const feedback = useFeedback()

  return (
    <>
      <div className="flex justify-start">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
              />
            }
            aria-label="Ouvrir le menu du compte"
          >
            <Avatar size="lg">
              {photo && <AvatarImage src={photo} alt="" />}
              <AvatarFallback
                className={cn(avatarTint(displayName || "?"), "font-semibold")}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onSettings}
                className="cursor-pointer px-3"
              >
                <HugeiconsIcon
                  icon={Settings02Icon}
                  strokeWidth={1.5}
                  className="size-4"
                />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onAskAbout}
                className="cursor-pointer px-3"
              >
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  strokeWidth={1.5}
                  className="size-4"
                />
                À propos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={feedback.ask}
                className="cursor-pointer px-3"
              >
                <HugeiconsIcon
                  icon={SproutIcon}
                  strokeWidth={1.5}
                  className="size-4"
                />
                Feedback
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={onAskLogout}
                className="cursor-pointer px-3"
              >
                <HugeiconsIcon
                  icon={LogOutIcon}
                  strokeWidth={1.5}
                  className="size-4"
                />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AboutDialog open={aboutOpen} onOpenChange={onAboutOpenChange} />

      <FeedbackDialog
        open={feedback.open}
        onOpenChange={feedback.setOpen}
        type={feedback.type}
        onTypeChange={feedback.setType}
        message={feedback.message}
        onMessageChange={feedback.setMessage}
        onSubmit={() => void feedback.submit()}
        pending={feedback.pending}
        error={feedback.error}
        sent={feedback.sent}
      />

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!loggingOut) onConfirmOpenChange(open)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Se déconnecter ?</DialogTitle>
            <DialogDescription>
              Tu seras déconnecté de ton compte ÉcoleDirecte et tes réglages
              enregistrés sur cet appareil seront effacés. Tu devras ressaisir
              tes identifiants pour utiliser Scolup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="secondary" disabled={loggingOut} />}
            >
              Annuler
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Déconnexion…" : "Déconnexion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
