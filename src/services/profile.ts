import { ld } from "@/services/litedirecte"
import {
  delSetting,
  getSetting,
  getSettingSync,
  setSetting,
} from "@/services/storage"

const PROFILE_NAME_KEY = "profileName"
const PROFILE_BIO_KEY = "profileBio"
const PROFILE_PHOTO_KEY = "profilePhoto"

export function accountDisplayName(): string {
  const account = ld.auth.getAccount()
  return account ? `${account.prenom ?? ""} ${account.nom ?? ""}`.trim() : ""
}

function cleanName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function profileNameSync(): string | null {
  return cleanName(getSettingSync(PROFILE_NAME_KEY))
}

export function profilePhotoSync(): string | null {
  const photo = getSettingSync(PROFILE_PHOTO_KEY)
  return typeof photo === "string" && photo ? photo : null
}

export async function loadProfile(): Promise<{
  name: string | null
  bio: string | null
  photo: string | null
}> {
  const [name, bio, photo] = await Promise.all([
    getSetting(PROFILE_NAME_KEY),
    getSetting(PROFILE_BIO_KEY),
    getSetting(PROFILE_PHOTO_KEY),
  ])
  return {
    name: cleanName(name),
    bio: cleanName(bio),
    photo: typeof photo === "string" && photo ? photo : null,
  }
}

export async function setProfileName(name: string): Promise<void> {
  const clean = name.trim().slice(0, 40)
  if (clean) await setSetting(PROFILE_NAME_KEY, clean)
  else await delSetting(PROFILE_NAME_KEY)
}

export async function setProfileBio(bio: string): Promise<void> {
  const clean = bio.trim().slice(0, 120)
  if (clean) await setSetting(PROFILE_BIO_KEY, clean)
  else await delSetting(PROFILE_BIO_KEY)
}

export async function setProfilePhoto(dataUrl: string): Promise<void> {
  await setSetting(PROFILE_PHOTO_KEY, dataUrl)
}

export async function clearProfilePhoto(): Promise<void> {
  await delSetting(PROFILE_PHOTO_KEY)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("image"))
    img.src = src
  })
}

export async function fileToProfilePhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, 256 / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas")
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL("image/jpeg", 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
