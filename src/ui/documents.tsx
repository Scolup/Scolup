"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Attachment01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  LoaderCircleIcon,
} from "@hugeicons/core-free-icons"
import { ld } from "@/services/lowdirecte"
import { cn } from "@/lib/utils"
import { errorMessage } from "@/services/errors"
import {
  attachmentKind,
  formatSize,
  type DownloadableFile,
} from "@/services/attachments"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/ui/inline-error"

export function Documents({
  documents,
  fileType = "FICHIER_CDT",
  year,
  bare = false,
}: {
  documents: DownloadableFile[]
  fileType?: string
  year?: string | number
  bare?: boolean
}) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [downloadedId, setDownloadedId] = useState<number | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const fetchBlob = (doc: DownloadableFile) =>
    ld.downloads.download({
      as: "blob",
      params: {
        fichierId: doc.id,
        leTypeDeFichier: doc.type || fileType,
        anneeMessages: year,
        forceDownload: 0,
      },
    } as never) as Promise<Blob>

  const handleDownload = async (doc: DownloadableFile) => {
    if (!doc.id) {
      setFailure(
        `Impossible de télécharger "${doc.name}" : identifiant manquant.`
      )
      return
    }
    setFailure(null)
    setDownloadedId(null)
    setDownloadingId(doc.id)
    try {
      const blob = await fetchBlob(doc)

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.name
      a.rel = "noopener"
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      setDownloadedId(doc.id)
      setTimeout(
        () => setDownloadedId((id) => (id === doc.id ? null : id)),
        1800
      )
    } catch (err) {
      setFailure(errorMessage(err, `Impossible de télécharger "${doc.name}".`))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className={bare ? "flex flex-col gap-2" : "flex items-start gap-3"}>
      {!bare && (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-input/60 text-muted-foreground">
          <HugeiconsIcon
            icon={Attachment01Icon}
            className="size-4"
            aria-hidden="true"
          />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-xs text-muted-foreground">
          Pièces jointes · {documents.length}
        </span>
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => {
            const isDownloading = downloadingId === doc.id
            const justDownloaded = downloadedId === doc.id
            const kind = attachmentKind(doc.name)
            return (
              <li
                key={`${doc.id}-${doc.name}`}
                className="flex items-center gap-2"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDownloading || !doc.id}
                  onClick={() => handleDownload(doc)}
                  aria-label={`Télécharger ${doc.name}`}
                  title={
                    !doc.id
                      ? "Fichier non téléchargeable"
                      : `Télécharger ${doc.name}`
                  }
                  // min-w-0 : sans lui, la largeur min auto du bouton suit
                  // le nom (nowrap) et le `truncate` ci-dessous ne peut
                  // jamais mordre — le drawer scrolle horizontalement.
                  className="h-auto min-h-14 min-w-0 flex-1 justify-start gap-3 rounded-2xl px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      kind.tint
                    )}
                  >
                    <HugeiconsIcon
                      icon={kind.icon}
                      className="size-4"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="w-full truncate text-sm font-medium">
                      {doc.name}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {kind.label}
                      {typeof doc.size === "number"
                        ? ` · ${formatSize(doc.size)}`
                        : ""}
                    </span>
                  </span>
                  {isDownloading ? (
                    <HugeiconsIcon
                      icon={LoaderCircleIcon}
                      className="shrink-0 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : justDownloaded ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Download01Icon}
                      className="shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
        {failure && (
          <InlineError
            title="Téléchargement impossible"
            message={failure}
            onRetry={() => setFailure(null)}
            actionLabel="Fermer"
          />
        )}
      </span>
    </div>
  )
}
