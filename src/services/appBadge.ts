// The app badge is only a mirror of the unread count: an unknown count leaves
// the icon alone rather than clearing a badge the icon may already show.
export function syncAppBadge(count: number | null) {
  if (count === null || typeof navigator.setAppBadge !== "function") return
  void navigator.setAppBadge(count > 0 ? count : 0).catch(() => {})
}
