import { Suspense } from "react"
import { Navigate, useNavigate, useParams } from "react-router"
import { HomePage } from "@/pages/home/HomePage"
import {
  isSectionId,
  settingsPath,
  type SectionId,
} from "@/pages/settings/sections"
import { SettingsDialog } from "./lazyPages"

// Un seul composant pour les deux routes (« / » et « /settings »): React
// garde `<HomePage />` monté pendant la navigation au lieu de le recréer, ce
// qui évite de recharger tous les widgets de l'accueil.
export function HomeRoute({ settings = false }: { settings?: boolean }) {
  const navigate = useNavigate()
  const { sectionId } = useParams()
  const redirects =
    sectionId === "general" ||
    (sectionId !== undefined && !isSectionId(sectionId))

  if (settings && redirects) return <Navigate to="/settings" replace />

  return (
    <>
      <HomePage />
      {settings && (
        <Suspense fallback={null}>
          <SettingsDialog
            open
            active={(sectionId ?? "general") as SectionId}
            onActiveChange={(section) => navigate(settingsPath(section))}
            onOpenChange={(open) => {
              if (!open) navigate("/")
            }}
          />
        </Suspense>
      )}
    </>
  )
}
