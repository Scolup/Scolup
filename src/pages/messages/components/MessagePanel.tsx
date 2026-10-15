"use client"

import { AnimatePresence, m } from "motion/react"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { MessageView, type MessageViewProps } from "./MessageView"

export function MessagePanel(props: MessageViewProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  if (!props.message) return null

  if (isDesktop) {
    return (
      <AnimatePresence>
        <m.div
          key="desktop-view"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
          className="fixed inset-0 z-30 bg-background"
        >
          <MessageView {...props} />
        </m.div>
      </AnimatePresence>
    )
  }

  return (
    <Drawer open onOpenChange={(open) => !open && props.onClose?.()}>
      <DrawerContent>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MessageView {...props} closeIcon="close" />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
