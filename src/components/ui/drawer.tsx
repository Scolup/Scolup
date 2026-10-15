import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  // ponytail: on désactive le repositionnement clavier de Vaul (il fige une
  // hauteur inline qui reste fausse après fermeture du clavier). Le décalage
  // au-dessus du clavier est géré par `--kb-offset` dans DrawerContent.
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      repositionInputs={false}
      {...props}
    />
  )
}

// Hauteur du clavier à partir du visualViewport. Vaut 0 quand le focus
// n'est pas dans un champ, donc la barre d'outils Safari n'a aucun effet.
function useKeyboardOffset(): number {
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = document.activeElement
        const typing =
          el instanceof HTMLElement &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable)
        if (!typing) {
          setOffset(0)
          return
        }
        setOffset(
          Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height))
        )
      })
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    document.addEventListener("focusin", update)
    document.addEventListener("focusout", update)
    return () => {
      cancelAnimationFrame(raf)
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      document.removeEventListener("focusin", update)
      document.removeEventListener("focusout", update)
    }
  }, [])

  return offset
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  const kbOffset = useKeyboardOffset()
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col overflow-hidden border border-border bg-popover text-sm shadow-xl data-[vaul-drawer-direction=bottom]:inset-x-2 data-[vaul-drawer-direction=bottom]:bottom-[calc(0.5rem_+_var(--kb-offset,0px))] data-[vaul-drawer-direction=bottom]:max-h-[calc(92dvh_-_var(--kb-offset,0px))] data-[vaul-drawer-direction=bottom]:rounded-[24px] data-[vaul-drawer-direction=left]:inset-y-2 data-[vaul-drawer-direction=left]:left-2 data-[vaul-drawer-direction=left]:w-[calc(75%-8px)] data-[vaul-drawer-direction=left]:rounded-[24px] data-[vaul-drawer-direction=right]:inset-y-2 data-[vaul-drawer-direction=right]:right-2 data-[vaul-drawer-direction=right]:w-[calc(75%-8px)] data-[vaul-drawer-direction=right]:rounded-[24px] data-[vaul-drawer-direction=top]:inset-x-2 data-[vaul-drawer-direction=top]:top-2 data-[vaul-drawer-direction=top]:max-h-[92dvh] data-[vaul-drawer-direction=top]:rounded-[24px] data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          className
        )}
        style={
          {
            ...style,
            ...(kbOffset > 0 ? { "--kb-offset": `${kbOffset}px` } : null),
          } as React.CSSProperties
        }
        {...props}
      >
        <div className="mx-auto mt-2 hidden h-1.5 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
