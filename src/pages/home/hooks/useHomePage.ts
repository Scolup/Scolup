import { useCallback, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { ld } from "@/services/litedirecte"
import { useAsync } from "@/hooks/useAsync"
import { accountDisplayName } from "@/services/account"
import { resetOnboarding } from "@/features/onboarding/onboardingStatus"
import { clearAllData } from "@/services/storage"
import { errorMessage } from "@/services/errors"
import { triggerHapticLight } from "@/services/haptics"
import { initialsFromName } from "@/lib/utils"

export function useHomePage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { loading } = useAsync(() => ld.auth.loadSession(), [pathname])

  // The account is already in memory, so reading it synchronously keeps the
  // name from flashing to "?" on every pathname-driven refetch.
  const displayName = accountDisplayName()

  const openPage = useCallback(
    (path: string) => {
      triggerHapticLight()
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
      await clearAllData()
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
