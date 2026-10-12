import {
  File01Icon,
  Pdf01Icon,
  Doc01Icon,
  SheetIcon,
  Zip01Icon,
  Image01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

export interface AttachmentKind {
  icon: typeof File01Icon
  tint: string
  label: string
}

export interface DownloadableFile {
  id: number
  name: string
  type: string
  size?: number
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const attachmentKinds = {
  pdf: {
    icon: Pdf01Icon,
    tint: "bg-destructive/10 text-destructive",
    label: "PDF",
  },
  doc: { icon: Doc01Icon, tint: "bg-info/10 text-info", label: "Document" },
  xls: {
    icon: SheetIcon,
    tint: "bg-success/10 text-success",
    label: "Tableur",
  },
  zip: {
    icon: Zip01Icon,
    tint: "bg-warning/10 text-warning",
    label: "Archive",
  },
  img: {
    icon: Image01Icon,
    tint: "bg-primary/10 text-primary",
    label: "Image",
  },
  vid: {
    icon: Video01Icon,
    tint: "bg-warning/10 text-warning",
    label: "Vidéo",
  },
} satisfies Record<string, AttachmentKind>

const attachmentExtensions: Record<string, keyof typeof attachmentKinds> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  odt: "doc",
  xls: "xls",
  xlsx: "xls",
  csv: "xls",
  zip: "zip",
  rar: "zip",
  "7z": "zip",
  jpg: "img",
  jpeg: "img",
  png: "img",
  gif: "img",
  webp: "img",
  heic: "img",
  mp4: "vid",
  mov: "vid",
  webm: "vid",
}

const defaultAttachmentKind: AttachmentKind = {
  icon: File01Icon,
  tint: "bg-muted text-muted-foreground",
  label: "Fichier",
}

export function attachmentKind(name: string): AttachmentKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const kind = attachmentExtensions[ext]
  return kind ? attachmentKinds[kind] : defaultAttachmentKind
}
