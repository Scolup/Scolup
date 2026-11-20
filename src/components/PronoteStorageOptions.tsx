import { Button } from "@/components/ui/button"

const planned = [
  "OneDrive",
  "Google Drive",
  "Dropbox",
  "MEGA",
  "Base de données Scolup",
]

export function PronoteStorageOptions({
  selected,
  onLocal,
}: {
  selected: boolean
  onLocal: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={selected ? "secondary" : "default"}
        onClick={onLocal}
        className="min-h-11 justify-between gap-2 rounded-full px-4"
      >
        Stockage sur cet appareil
        {selected && (
          <span className="text-xs text-muted-foreground">Actif</span>
        )}
      </Button>
      <p className="px-1 text-xs text-muted-foreground">
        Tes rubis, tes quêtes et tes réglages restent dans ce navigateur, sans
        synchronisation.
      </p>
      {planned.map((name) => (
        <div
          key={name}
          className="flex min-h-11 items-center justify-between gap-2 rounded-full border border-border/70 px-4 text-sm text-muted-foreground"
        >
          <span>{name}</span>
          <span className="text-xs">Plus tard</span>
        </div>
      ))}
    </div>
  )
}
