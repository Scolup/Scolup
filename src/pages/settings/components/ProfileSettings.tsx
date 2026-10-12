"use client"

import { useEffect, useRef, useState } from "react"
import { ld } from "@/services/lowdirecte"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, avatarTint, initialsFromName } from "@/lib/utils"
import {
  accountDisplayName,
  clearProfilePhoto,
  fileToProfilePhoto,
  loadProfile,
  setProfileBio,
  setProfileName,
  setProfilePhoto,
} from "@/services/profile"

export function ProfileSettings() {
  const [draft, setDraft] = useState("")
  const [bioDraft, setBioDraft] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [accountName, setAccountName] = useState("")
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ld.auth.loadSession()
      if (cancelled) return
      setAccountName(accountDisplayName())
      const profile = await loadProfile()
      if (cancelled) return
      setDraft(profile.name ?? "")
      setBioDraft(profile.bio ?? "")
      setPhoto(profile.photo)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const saveName = async () => {
    await setProfileName(draft)
    setDraft((current) => current.trim().slice(0, 40))
  }

  const saveBio = async () => {
    await setProfileBio(bioDraft)
    setBioDraft((current) => current.trim().slice(0, 120))
  }

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setPhotoBusy(true)
    setError(null)
    try {
      const dataUrl = await fileToProfilePhoto(file)
      await setProfilePhoto(dataUrl)
      setPhoto(dataUrl)
    } catch {
      setError("Cette image est illisible, essaie-en une autre.")
    }
    setPhotoBusy(false)
  }

  const removePhoto = async () => {
    await clearProfilePhoto()
    setPhoto(null)
  }

  const displayName = draft.trim() || accountName || "?"

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">Profil</p>
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-4 py-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-hidden="true"
          tabIndex={-1}
          className="hidden"
          onChange={(e) => {
            void pickPhoto(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={() => {
            fileRef.current?.click()
          }}
          aria-label="Changer la photo de profil"
          className="group relative size-20 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Avatar className="size-20">
            {photo && <AvatarImage src={photo} alt="" />}
            <AvatarFallback
              className={cn(avatarTint(displayName), "text-xl font-semibold")}
            >
              {initialsFromName(displayName)}
            </AvatarFallback>
          </Avatar>
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              strokeWidth={2}
              className="size-6 text-white"
            />
          </span>
        </button>
        {photo &&
          (photoBusy ? (
            <p className="text-xs text-muted-foreground">Chargement…</p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void removePhoto()}
            >
              Retirer la photo
            </Button>
          ))}
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor="profile-name"
            className="text-xs font-medium text-muted-foreground"
          >
            Nom de profil
          </label>
          <Input
            id="profile-name"
            value={draft}
            maxLength={40}
            autoComplete="off"
            placeholder={accountName || "Ton nom"}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void saveName()}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
            }}
          />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor="profile-bio"
            className="text-xs font-medium text-muted-foreground"
          >
            Bio
          </label>
          <Input
            id="profile-bio"
            value={bioDraft}
            maxLength={120}
            autoComplete="off"
            placeholder="Quelques mots sur toi…"
            onChange={(e) => setBioDraft(e.target.value)}
            onBlur={() => void saveBio()}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
            }}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
