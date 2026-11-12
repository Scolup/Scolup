import type { CSSProperties } from "react"
import { RichHtml } from "@/components/RichHtml"
import { entranceRank } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { proseClassName } from "@/lib/prose"
import type { PostIt } from "../postIt"

export function PostItCard({
  note,
  enterIndex,
}: {
  note: PostIt
  // Rang d'entrée (voir `rise`), ou undefined pour ne pas animer.
  enterIndex?: number
}) {
  const rank = enterIndex === undefined ? null : entranceRank(enterIndex)
  return (
    <article
      style={rank !== null ? ({ "--i": rank } as CSSProperties) : undefined}
      className={cn(
        "mb-3 max-w-full min-w-0 press-lg break-inside-avoid overflow-hidden rounded-2xl border p-4",
        "hover:shadow-md",
        rank !== null && "rise",
        note.tint
      )}
    >
      <RichHtml
        html={note.html}
        className={cn(
          proseClassName,
          "max-w-full min-w-0 overflow-hidden [&_*]:max-w-full [&_img]:cursor-zoom-in [&_p]:mb-2 [&_p]:last:mb-0"
        )}
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
