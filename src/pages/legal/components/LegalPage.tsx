import { cn } from "@/lib/utils"
import { proseClassName } from "@/ui/prose"
import type { DocId } from "../docs"
import { LegalNav } from "./LegalNav"

interface LegalPageProps extends React.ComponentProps<"div"> {
  doc: DocId
  title: string
  children: React.ReactNode
}

export function LegalPage({ doc, title, className, children }: LegalPageProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col gap-6 p-6",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <img
          src="/logos/logo.svg"
          alt="Scolup"
          className="size-12 dark:invert"
        />
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {title}
        </h1>
      </div>

      <div className={proseClassName}>{children}</div>

      <LegalNav doc={doc} />
    </div>
  )
}
