import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  ImageUploadIcon,
  QrCodeScanIcon,
} from "@hugeicons/core-free-icons"
import { studentPortal } from "litenote/host"
import { Button } from "@/components/ui/button"

const invalidQr =
  "Utilise le QR d’association généré dans ton espace élève PRONOTE."

function getQrError(payload: string, portal: string) {
  try {
    const qr = JSON.parse(payload)
    if (
      typeof qr?.url !== "string" ||
      typeof qr.jeton !== "string" ||
      !qr.jeton ||
      typeof qr.login !== "string" ||
      !qr.login ||
      !/\/(?:mobile\.)?eleve\.html$/i.test(new URL(qr.url).pathname)
    )
      return invalidQr
    if (studentPortal(qr.url) !== studentPortal(portal)) {
      return "Ce QR correspond à un autre établissement PRONOTE."
    }
  } catch {
    return invalidQr
  }
  return ""
}

async function readImageQr(file: File) {
  if (file.size > 12_000_000) throw new Error("L’image est trop volumineuse.")
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const { naturalWidth: width, naturalHeight: height } = image
    const scale = Math.min(1, 1800 / Math.max(width, height))
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) throw new Error("Lecture d’image indisponible.")
    const { default: decode } = await import("jsqr")
    const readAtScale = (ratio: number) => {
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      return decode(pixels.data, pixels.width, pixels.height)?.data
    }
    const qr = readAtScale(scale)
    if (qr || scale === 1 || width * height > 12_000_000) return qr
    return readAtScale(1)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function QrCamera({ onRead }: { onRead: (value: string) => void }) {
  const preview = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<"opening" | "ready" | "error">("opening")

  useEffect(() => {
    const video = preview.current
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!video || !context) return

    let cancelled = false
    let stream: MediaStream | undefined
    let timer: number | undefined

    function stop() {
      if (timer !== undefined) window.clearInterval(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }

    async function scan() {
      if (!video || !context) return
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        })
        if (cancelled) {
          stop()
          return
        }

        video.srcObject = stream
        const { default: decode } = await import("jsqr")
        if (cancelled) return
        await video.play()
        if (cancelled) return

        setStatus("ready")
        timer = window.setInterval(() => {
          if (!video.videoWidth || !video.videoHeight) return

          const scale = Math.min(
            1,
            720 / Math.max(video.videoWidth, video.videoHeight)
          )
          const width = Math.max(1, Math.round(video.videoWidth * scale))
          const height = Math.max(1, Math.round(video.videoHeight * scale))
          if (canvas.width !== width) canvas.width = width
          if (canvas.height !== height) canvas.height = height

          context.drawImage(video, 0, 0, width, height)
          const pixels = context.getImageData(0, 0, width, height)
          const qr = decode(pixels.data, width, height)
          if (qr?.data) {
            stop()
            onRead(qr.data)
          }
        }, 160)
      } catch {
        stop()
        if (!cancelled) setStatus("error")
      }
    }

    void scan()
    return () => {
      cancelled = true
      stop()
      video.srcObject = null
    }
  }, [onRead])

  return (
    <div className="flex flex-col gap-2">
      {status !== "error" && (
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-black">
          <video
            ref={preview}
            muted
            playsInline
            className="absolute inset-0 size-full object-contain"
            aria-label="Aperçu de la caméra"
          />
          {status === "ready" ? (
            <span
              aria-hidden="true"
              className="z-10 aspect-square h-3/4 rounded-2xl border-2 border-white/80"
            />
          ) : (
            <span role="status" className="z-10 text-sm text-white">
              Accès à la caméra…
            </span>
          )}
        </div>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          Caméra indisponible. Tu peux importer une image de ton QR code.
        </p>
      )}
    </div>
  )
}

export function PronoteQrInput({
  portal,
  value,
  onRead,
  disabled,
}: {
  portal: string
  value: string
  onRead: (value: string) => void
  disabled: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")

  const acceptQr = useCallback(
    (qr: string) => {
      setScanning(false)
      const message = getQrError(qr, portal)
      setError(message)
      onRead(message ? "" : qr)
    },
    [onRead, portal]
  )

  async function importFile(file: File) {
    onRead("")
    setError("")
    setImporting(true)
    try {
      const qr = await readImageQr(file)
      if (qr) acceptQr(qr)
      else setError("Aucun QR code lisible dans cette image.")
    } catch {
      setError(
        file.size > 12_000_000
          ? "L’image est trop volumineuse."
          : "Impossible d’ouvrir cette image."
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={scanning ? "outline" : "secondary"}
          className="min-h-11 flex-1 gap-2 sm:min-h-0"
          aria-expanded={scanning}
          disabled={disabled || importing}
          onClick={() => {
            setError("")
            if (!scanning) onRead("")
            setScanning((current) => !current)
          }}
        >
          <HugeiconsIcon
            icon={QrCodeScanIcon}
            aria-hidden="true"
            className="size-5"
          />
          {scanning ? "Fermer la caméra" : "Scanner le QR code"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 sm:size-8"
          aria-label="Importer une image du QR code"
          title="Importer une image du QR code"
          disabled={disabled || importing}
          onClick={() => input.current?.click()}
        >
          <HugeiconsIcon
            icon={ImageUploadIcon}
            aria-hidden="true"
            className="size-5"
          />
        </Button>
        <input
          ref={input}
          aria-label="Image du QR code"
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ""
            if (!file) return
            setScanning(false)
            void importFile(file)
          }}
        />
      </div>
      {scanning && <QrCamera onRead={acceptQr} />}
      {importing && (
        <p role="status" className="text-sm text-muted-foreground">
          Lecture de l’image…
        </p>
      )}
      {value && (
        <p
          role="status"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="size-4 text-success"
            aria-hidden="true"
          />
          QR code détecté
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
