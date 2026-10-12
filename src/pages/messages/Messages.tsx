"use client"

import { AnimatePresence, m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useMessagesPage } from "./hooks/useMessagesPage"
import { useCompose } from "./hooks/useCompose"
import { useContacts } from "./hooks/useContacts"
import { MessageList } from "./components/MessageList"
import { MessagePanel } from "./components/MessagePanel"
import { ComposeDrawer } from "./components/ComposeDrawer"
import { AppToast } from "@/ui/app-toast"

export function Messages() {
  const page = useMessagesPage()
  const compose = useCompose(page.retry)
  const contactsState = useContacts(compose.open || !!page.selected)
  const actionError = compose.error ?? page.actionError
  const dismissActionError = () => {
    compose.clearError()
    page.dismissActionError()
  }

  return (
    <>
      <AppToast message={actionError} onClose={dismissActionError} />
      <MessageList
        folder={page.folder}
        onFolderChange={page.setFolder}
        input={page.query}
        onInputChange={page.setQuery}
        loading={page.loading}
        error={page.error}
        onRetry={page.retry}
        messages={page.messages}
        query={page.query}
        unreadMessages={page.unreadMessages}
        showUnreadHighlights={page.showUnreadHighlights}
        pageMessages={page.pageMessages}
        page={page.requestedPage}
        currentPage={page.currentPage}
        totalPages={page.totalPages}
        pages={page.pages}
        leftEllipsis={page.leftEllipsis}
        rightEllipsis={page.rightEllipsis}
        onSelect={page.selectMessage}
        onPageChange={page.setPage}
      />
      <AnimatePresence>
        {!compose.open && !page.selected && (
          <m.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            whileTap={{ scale: 0.9 }}
            className="fixed right-4 z-20"
            style={{
              bottom:
                "calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <Button
              onClick={compose.openNew}
              aria-label="Nouveau message"
              className="size-14 rounded-full shadow-lg"
              size="icon"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-6" />
            </Button>
          </m.div>
        )}
      </AnimatePresence>
      <MessagePanel
        message={page.selected}
        contentLoading={page.contentLoading}
        contentRefreshing={page.contentRefreshing}
        contentError={page.contentError}
        onRetry={page.retrySelected}
        onClose={page.closeMessage}
        onMarkUnread={
          page.selected ? () => page.markUnread(page.selected!) : undefined
        }
        onReply={
          page.selected
            ? () => compose.openReply(page.selected!, contactsState.contacts)
            : undefined
        }
      />
      <ComposeDrawer
        compose={compose}
        contacts={contactsState.contacts}
        contactsLoading={contactsState.loading}
        contactsError={contactsState.error}
        onRetryContacts={contactsState.retry}
      />
    </>
  )
}
