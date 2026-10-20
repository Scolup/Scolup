"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, SchoolIcon } from "@hugeicons/core-free-icons"
import { ld } from "@/services/litedirecte"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsFromName } from "@/lib/utils"

interface AccountInfo {
  name: string
  initials: string
  photo: string | null
  email: string | null
  school: string | null
  klass: string | null
}

function readAccount(): AccountInfo {
  const account = ld.auth.getAccount()
  if (!account) {
    return {
      name: "",
      initials: "?",
      photo: null,
      email: null,
      school: null,
      klass: null,
    }
  }
  const name = `${account.prenom ?? ""} ${account.nom ?? ""}`.trim()
  return {
    name,
    initials: name ? initialsFromName(name) : "?",
    photo: account.profile?.photo || null,
    email: account.email || null,
    school: account.nomEtablissement || null,
    klass: account.profile?.classe?.libelle || null,
  }
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: typeof Mail01Icon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <HugeiconsIcon
        icon={icon}
        strokeWidth={1.5}
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium text-card-foreground">
          {value}
        </span>
      </div>
    </div>
  )
}

export function AccountSettings() {
  const [info, setInfo] = useState<AccountInfo | null>(null)

  useEffect(() => {
    let active = true
    void ld.auth.loadSession().then(() => {
      if (active) setInfo(readAccount())
    })
    return () => {
      active = false
    }
  }, [])

  if (!info) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">Compte connecté</p>
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card px-4 py-5">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {info.photo && <AvatarImage src={info.photo} alt="" />}
            <AvatarFallback className="font-semibold">
              {info.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-card-foreground">
              {info.name || "Compte ÉcoleDirecte"}
            </span>
            {info.klass && (
              <span className="truncate text-xs text-muted-foreground">
                {info.klass}
              </span>
            )}
          </div>
        </div>
        {info.school && (
          <InfoRow
            icon={SchoolIcon}
            label="Établissement"
            value={info.school}
          />
        )}
        {info.email && (
          <InfoRow icon={Mail01Icon} label="E-mail" value={info.email} />
        )}
      </div>
    </div>
  )
}
