import { useHomeworkPage } from "./hooks/useHomeworkPage"
import { HomeworkDrawer } from "./components/HomeworkDrawer"
import { HomeworkList } from "./components/HomeworkList"
import { AppToast } from "@/components/AppToast"
import { DecoSprinkles, DecoSticker } from "@/components/DecoOrnament"

export function Homework() {
  const page = useHomeworkPage()
  const actionError = page.toggleError ?? page.comment.error
  const dismissActionError = () => {
    page.dismissToggleError(null)
    page.comment.clearError()
  }

  return (
    <div className="relative isolate flex w-full flex-col gap-0">
      <DecoSticker charm={1} className="top-2 right-4" />
      <AppToast message={actionError} onClose={dismissActionError} />

      <HomeworkList
        groups={page.groups}
        loading={page.loading}
        error={page.error}
        onRetry={page.retry}
        pending={page.togglePending}
        onToggle={page.toggle}
        onSelect={page.detail.selectAssignment}
      />

      <DecoSprinkles />

      <HomeworkDrawer
        assignment={page.detail.selected}
        detail={page.detail.detail}
        loading={page.detail.detailLoading}
        error={page.detail.detailError}
        onRetry={page.detail.retryDetail}
        pending={
          page.detail.selected
            ? page.togglePending.has(page.detail.selected.key)
            : false
        }
        onToggle={page.toggle}
        comment={page.comment}
        onClose={page.detail.closeDetail}
      />
    </div>
  )
}
