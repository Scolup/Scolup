import { cn } from "@/lib/utils"
import { proseClassName } from "@/ui/prose"
import type { PostIt } from "../helpers"

export function PostItCard({ note }: { note: PostIt }) {
  return (
    <article
      className={cn(
        "mb-3 max-w-full min-w-0 break-inside-avoid overflow-hidden rounded-2xl border p-4",
        note.tint
      )}
    >
      <div
        className={cn(
          proseClassName,
          "max-w-full min-w-0 overflow-hidden [&_*]:max-w-full [&_img]:cursor-zoom-in [&_p]:mb-2 [&_p]:last:mb-0"
        )}
        dangerouslySetInnerHTML={{ __html: note.html }}
      />
      {(note.author ?? note.date) && (
        <div className="mt-3 text-xs opacity-70">
          {note.author && <p className="truncate font-medium">{note.author}</p>}
          {note.date && <p>{note.date}</p>}
        </div>
      )}
    </article>
  )
}
