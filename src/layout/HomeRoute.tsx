import { Suspense } from "react"
import { Navigate, useNavigate } from "react-router"
import { HomePage } from "@/pages/home/HomePage"
import {
  isSectionId,
  settingsPath,
  type SectionId,
} from "@/pages/settings/sections"
import { SettingsDialog } from "./lazyPages"

// L'accueil et les réglages partagent un seul composant : `<HomePage />` reste
// monté quand on ouvre ou ferme les réglages au lieu d'être recréé, ce qui
// évite de recharger tous les widgets. MainLayout indique si les réglages sont
// ouverts (`settings`) et sur quelle section (`sectionId`) ; l'accueil est
// gardé en vie par une <Activity>, il ne lit donc pas l'URL lui-même.
export function HomeRoute({
  settings = false,
  sectionId,
}: {
  settings?: boolean
  sectionId?: string
}) {
  const navigate = useNavigate()
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
