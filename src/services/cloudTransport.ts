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
  const tree = await ld.cloud.getCloud({ force: true })
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
    return { root, folder: null, files: [] }
  }
  const files = (folder.children ?? []).filter(
    (node): node is CloudFileNode => node.type === "file" && !node.isTrash
  )
  return { root, folder, files }
}

export async function ensureSyncFolder(
  listing: SyncListing
): Promise<CloudNode> {
  if (listing.folder) return listing.folder
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
      return await tryDownload(node, type)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
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
  try {
    if (existing) {
      // EcoleDirecte cloud refuses to overwrite a file with the same name.
      // Delete first, then create anew.
      await ld.cloud.deleteNodes([existing])
      await ld.cloud.createTextFile(text, name, folder)
    } else {
      await ld.cloud.createTextFile(text, name, folder)
    }
  } catch (e) {
    console.error("[sync] write failed:", e)
    throw e
  }
}

export async function removeNodes(nodes: CloudNode[]): Promise<void> {
  if (nodes.length > 0) {
    await ld.cloud.deleteNodes(nodes)
  }
}
