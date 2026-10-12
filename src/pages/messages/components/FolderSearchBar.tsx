import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive04Icon,
  Cancel01Icon,
  Search01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { folderIcon, folderLabel } from "../helpers"
import type { FolderKey } from "../helpers"

export function FolderSearchBar({
  folder,
  onFolderChange,
  input,
  onInputChange,
}: {
  folder: FolderKey
  onFolderChange: (value: FolderKey) => void
  input: string
  onInputChange: (value: string) => void
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-row items-center gap-2 border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur-md">
      <Select
        value={folder}
        onValueChange={(value) => {
          if (value) onFolderChange(value as FolderKey)
        }}
      >
        <SelectTrigger className="w-fit shrink-0">
          <SelectValue>
            {(value: string | null) => {
              const key = (value ?? "inbox") as FolderKey
              return (
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={folderIcon(key)}
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {folderLabel(key)}
                </span>
              )
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inbox">
            <HugeiconsIcon icon={Archive04Icon} className="size-4" />
            Principal
          </SelectItem>
          <SelectItem value="sent">
            <HugeiconsIcon icon={SentIcon} className="size-4" />
            Envoyés
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="group/search relative min-w-0 flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within/search:text-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Rechercher…"
          className="pr-8 pl-8"
          aria-label="Rechercher un message"
        />
        {input && (
          <button
            type="button"
            onClick={() => {
              onInputChange("")
            }}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 animate-in items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 zoom-in-90 fade-in hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-3.5"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  )
}
