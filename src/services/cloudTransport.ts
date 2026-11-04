// Tout ce que la synchronisation demande au cloud EcoleDirecte, via Litedirecte.
// Ce fichier isole les deux comportements du cloud qui n'ont pas pu être
// vérifiés ici (voir les mentions À VÉRIFIER) : si l'un d'eux est faux, c'est
// le seul endroit à corriger.

import type { CloudFileNode, CloudNode } from "litedirecte"
import { SYNC_FOLDER } from "@/features/sync/files"
import { ld } from "./litedirecte"

export interface SyncListing {
  root: CloudNode
  folder: CloudNode | null
  files: CloudFileNode[]
}

// `force` est indispensable : getCloud est mis en cache 60 s par le SDK et les
// envois ne l'invalident pas, on lirait sinon l'état d'avant notre propre écriture.
export async function listSyncFolder(): Promise<SyncListing | null> {
  console.debug("[sync] listing folder...")
  const tree = await ld.cloud.getCloud({ force: true })
  console.debug("[sync] getCloud returned", tree?.length ?? 0, "root items")
  const root = tree[0]
  if (!root || root.type !== "folder") {
    console.warn("[sync] no root folder")
    return null
  }
  const folder =
    root.children?.find(
      (node) =>
        node.type === "folder" && node.libelle === SYNC_FOLDER && !node.isTrash
    ) ?? null
  if (!folder) {
    console.debug("[sync] Scolup folder not found")
    return { root, folder: null, files: [] }
  }
  console.debug(
    "[sync] Scolup folder found, children:",
    folder.children?.length ?? 0
  )
  const files = (folder.children ?? []).filter(
    (node): node is CloudFileNode => node.type === "file" && !node.isTrash
  )
  console.debug(
    "[sync] sync files:",
    files.map((f) => f.libelle)
  )
  return { root, folder, files }
}

export async function ensureSyncFolder(
  listing: SyncListing
): Promise<CloudNode> {
  if (listing.folder) return listing.folder
  console.debug("[sync] creating Scolup folder")
  return ld.cloud.createFolder(SYNC_FOLDER, listing.root)
}

async function tryDownload(
  node: CloudFileNode,
  leTypeDeFichier: string
): Promise<string> {
  const blob = (await ld.downloads.download({
    as: "blob",
    params: {
      fichierId: node.id,
      leTypeDeFichier,
      forceDownload: 0,
    },
  } as never)) as Blob
  return blob.text()
}

export async function readText(node: CloudFileNode): Promise<string> {
  // Le type de fichier pour les fichiers cloud n'est pas documenté.
  // On essaie plusieurs valeurs connues.
  const types = ["CLOUD", "FICHIER_CLOUD", "TEXT", "FICHIER_CDT", ""]
  let lastError: Error | null = null
  for (const type of types) {
    try {
      console.debug(
        "[sync] downloading",
        node.libelle,
        "with leTypeDeFichier =",
        type || "(empty)"
      )
      return await tryDownload(node, type)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      console.debug(
        "[sync] download failed with",
        type || "(empty)",
        ":",
        lastError.message
      )
    }
  }
  throw lastError ?? new Error("All download attempts failed")
}

export async function writeText(
  text: string,
  name: string,
  folder: CloudNode,
  existing: CloudFileNode | undefined
): Promise<void> {
  console.debug("[sync] writing", name, existing ? "(update)" : "(create)")
  try {
    if (existing) {
      // EcoleDirecte cloud refuses to overwrite a file with the same name.
      // Delete first, then create anew.
      console.debug("[sync] deleting existing file before overwrite")
      await ld.cloud.deleteNodes([existing])
      await ld.cloud.createTextFile(text, name, folder)
    } else {
      await ld.cloud.createTextFile(text, name, folder)
    }
    console.debug("[sync] write ok")
  } catch (e) {
    console.error("[sync] write failed:", e)
    throw e
  }
}

export async function removeNodes(nodes: CloudNode[]): Promise<void> {
  if (nodes.length > 0) {
    console.debug("[sync] removing", nodes.length, "stale/duplicate nodes")
    await ld.cloud.deleteNodes(nodes)
  }
}
