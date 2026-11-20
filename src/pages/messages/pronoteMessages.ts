import { DiscussionFolderKind as Folder, type Litenote } from "litenote"
import { discussionMessages } from "@blockshub/pawnote-lts"
import { withPronote, withPronoteSession } from "@/services/litenote"
import { toMessageHtml } from "./compose"
import { emptyMessageFolders } from "./folders"
import type { Message } from "./types"

type Discussion = Awaited<ReturnType<Litenote["messages"]>>[number]
const ids = new Map<string, number>()
const active = new Map<number, Discussion>()

export async function fetchPronoteMessages() {
  const discussions = await withPronote((client) => client.messages())
  const lists = emptyMessageFolders()
  active.clear()
  for (const discussion of discussions) {
    const folders = new Set(discussion.folders.map((folder) => folder.kind))
    const key = folders.has(Folder.OCEM_Pre_Archive)
      ? "archived"
      : folders.has(Folder.OCEM_Pre_Reception)
        ? "inbox"
        : folders.has(Folder.OCEM_Pre_Envoye)
          ? "sent"
          : "inbox"
    const nativeId = discussion.participantsMessageID
    const id = ids.get(nativeId) ?? ids.size + 1
    ids.set(nativeId, id)
    active.set(id, discussion)
    const message: Message = {
      id,
      subject: discussion.subject,
      sender: discussion.creator,
      time: discussion.date,
      recipients: discussion.recipientName ? [discussion.recipientName] : [],
      unread: discussion.numberOfMessagesUnread > 0,
      sent: key === "sent",
    }
    if (folders.has(Folder.OCEM_Pre_Poubelle)) {
      lists.trash.push({ ...message, unread: false })
      continue
    }
    const markedAsDraft = folders.has(Folder.OCEM_Pre_Brouillon)
    if (markedAsDraft || discussion.numberOfDrafts > 0) {
      lists.drafts.push({ ...message, unread: false, draft: true })
    }
    if (markedAsDraft && discussion.numberOfMessages === 0) continue
    lists[key].push(message)
    lists.all.push(message)
  }
  return lists
}

export async function openPronoteMessage(base: Message): Promise<Message> {
  const discussion = active.get(base.id)
  if (!discussion) throw new Error("Actualise la liste des messages.")
  const detail = base.draft
    ? await withPronoteSession((session) =>
        discussionMessages(session, discussion)
      )
    : await withPronote((client) => client.message(discussion))
  const entries = detail.sents
  const attachments = entries
    .flatMap((entry) => entry.files)
    .map((file, index) => ({
      id: index + 1,
      name: file.name,
      type: "pronote",
      url: file.url,
    }))
  return {
    ...base,
    body: base.draft
      ? detail.drafts
          .map((entry) =>
            entry.isHTML ? entry.content : toMessageHtml(entry.content)
          )
          .join("<hr>")
      : entries.map((entry) => entry.content).join("<hr>"),
    unread: false,
    attachments: base.draft ? [] : attachments,
    hasAttachment: !base.draft && attachments.length > 0,
  }
}
