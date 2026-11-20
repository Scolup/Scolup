import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { folderDetails, getFolderOptions } from "../folders"
import { type FolderKey } from "../types"

export function FolderSearchBar({
  pronote,
  folder,
  onFolderChange,
  input,
  onInputChange,
}: {
  pronote: boolean
  folder: FolderKey
  onFolderChange: (value: FolderKey) => void
  input: string
  onInputChange: (value: string) => void
}) {
  const options = getFolderOptions(pronote)
  const selected = folderDetails(folder)
  return (
    <div className="relative sticky top-0 z-10 flex flex-row items-center gap-2 border-b border-border/60 px-4 py-2">
      <Select
        value={folder}
        onValueChange={(value) => {
          if (value) onFolderChange(value as FolderKey)
        }}
      >
        <SelectTrigger className="w-fit shrink-0" aria-label="Dossier">
          <SelectValue>
            {() => (
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={selected.icon}
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                {selected.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((value) => {
              const { icon, label } = folderDetails(value)
              return (
                <SelectItem key={value} value={value}>
                  <HugeiconsIcon
                    icon={icon}
                    className="size-4"
                    aria-hidden="true"
                  />
                  {label}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="group/search relative min-w-0 flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-150 group-focus-within/search:text-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Rechercher…"
          className="pr-8 pl-8"
          aria-label={
            pronote ? "Rechercher une discussion" : "Rechercher un message"
          }
        />
        {input && (
          <button
            type="button"
            onClick={() => {
              onInputChange("")
            }}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 press-sm animate-in items-center justify-center rounded-full text-muted-foreground zoom-in-90 fade-in hover:bg-muted hover:text-foreground"
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
