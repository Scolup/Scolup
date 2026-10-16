import { useCallback, useState } from "react"
import { useNavigate } from "react-router"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { useAsync } from "@/hooks/use-async"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { NO_NOTES, toPostIt } from "../helpers"

export interface ImageViewerState {
  src: string
  alt: string
}

export function usePostIts() {
  const navigate = useNavigate()
  const [reloadKey, setReloadKey] = useState(0)
  const [viewer, setViewer] = useState<ImageViewerState | null>(null)
  const liveTimeline = useLiveRefresh("commonTimeline")

  const retry = useCallback(() => setReloadKey((key) => key + 1), [])

  const { data, error, loading } = useAsync(async () => {
    if (!(await ld.auth.loadSession())) {
      throw new Error("Aucune session active. Reconnecte-toi.")
    }
    const result = (await ld.timeline.getCommonTimeline()) as {
      postits?: unknown
    }
    const raw = Array.isArray(result?.postits) ? result.postits : []
    return (raw as Record<string, unknown>[])
      .map((entry, index) => toPostIt(entry, index))
      .filter((note): note is NonNullable<typeof note> => note !== null)
  }, [reloadKey, liveTimeline])

  const goBack = useCallback(() => {
    navigate("/")
  }, [navigate])

  const openViewer = useCallback((event: React.MouseEvent) => {
    const image = (event.target as HTMLElement | null)?.closest?.(
      "img"
    ) as HTMLImageElement | null
    const src = image?.currentSrc || image?.getAttribute("src")
    if (!image || !src) return
    setViewer({ src, alt: image.getAttribute("alt") ?? "" })
  }, [])

  return {
    notes: data ?? NO_NOTES,
    loading,
    message: error
      ? errorMessage(error, "Impossible de charger les post-its.")
      : null,
    viewer,
    retry,
    goBack,
    openViewer,
    setViewer,
  }
}
