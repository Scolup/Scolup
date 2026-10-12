import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SECTIONS, type SectionIcon, type SectionId } from "../sections"

function NavButton({
  active,
  onClick,
  icon,
  label,
  className,
}: {
  active: boolean
  onClick: () => void
  icon: SectionIcon
  label: string
  className?: string
}) {
  return (
    <Button
      variant="ghost"
      aria-pressed={active}
      onClick={() => {
        onClick()
      }}
      className={cn(
        "gap-2",
        active && "bg-accent text-foreground hover:bg-accent",
        className
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-4.5" />
      {label}
    </Button>
  )
}

export function SettingsNav({
  active,
  onActiveChange,
  className,
  itemClassName,
}: {
  active: SectionId
  onActiveChange: (section: SectionId) => void
  className: string
  itemClassName: string
}) {
  return (
    <nav aria-label="Sections des paramètres" className={className}>
      {SECTIONS.map((section) => (
        <NavButton
          key={section.id}
          active={active === section.id}
          onClick={() => onActiveChange(section.id)}
          icon={section.icon}
          label={section.label}
          className={itemClassName}
        />
      ))}
    </nav>
  )
}
