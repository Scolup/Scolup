import { useCallback, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { ld } from "@/services/linkdirecte"
import { useAsync } from "@/hooks/use-async"
import {
  loadProfile,
  profileNameSync,
  profilePhotoSync,
} from "@/services/profile"
import { resetOnboarding } from "@/services/onboarding"
import { errorMessage } from "@/services/errors"
import { initialsFromName } from "@/lib/utils"

function studentName(): string {
  const account = ld.auth.getAccount()
  return account ? `${account.prenom ?? ""} ${account.nom ?? ""}`.trim() : ""
}

export function useHomePage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading } = useAsync(async () => {
    await ld.auth.loadSession()
    return { profile: await loadProfile() }
  }, [pathname])

  const profile = data?.profile ?? {
    name: profileNameSync(),
    photo: profilePhotoSync(),
  }
  // The account is already in memory, so reading it synchronously keeps the
  // name from flashing to "?" on every pathname-driven refetch.
  const displayName = profile.name || studentName()

  const openPage = useCallback(
    (path: string) => {
      navigate(path)
    },
    [navigate]
  )

  const openSettings = useCallback(() => openPage("/settings"), [openPage])

  const askLogout = useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const askAbout = useCallback(() => {
    setAboutOpen(true)
  }, [])

  const logout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    setActionError(null)
    try {
      await ld.auth.logout()
      await resetOnboarding()
      setConfirmOpen(false)
      window.location.href = "/"
    } catch (err) {
      setActionError(errorMessage(err, "Déconnexion impossible. Réessaie."))
    } finally {
      setLoggingOut(false)
    }
  }, [loggingOut])

  return {
    confirmOpen,
    aboutOpen,
    actionError,
    dismissActionError: () => setActionError(null),
    loggingOut,
    loading,
    photo: profile.photo,
    displayName,
    initials: displayName ? initialsFromName(displayName) : "?",
    openSettings,
    askLogout,
    askAbout,
    logout,
    openPage,
    setConfirmOpen,
    setAboutOpen,
  }
}
