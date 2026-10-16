import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { proseClassName } from "@/ui/prose"
import type { PostIt } from "../helpers"

export function PostItCard({ note }: { note: PostIt }) {
  return (
    <m.article
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.15, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "mb-3 max-w-full min-w-0 break-inside-avoid overflow-hidden rounded-2xl border p-4",
        "transition-shadow duration-200 hover:shadow-md",
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
    </m.article>
  )
}
