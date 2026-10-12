import { useEffect } from "react"

let revealed = false
// 1 stands for the route itself, released by revealRoute(). Widgets add to it
// while their data is in flight; the splash only goes once it reaches zero.
let pending = 1

function remove() {
  const splash = document.getElementById("splash")
  if (!splash) return
  splash.classList.add("is-leaving")
  // A timer rather than transitionend: transitions don't run in a background
  // tab, which would strand the splash on screen.
  setTimeout(() => splash.remove(), 250)
}

function settle() {
  // Deferred to a task: a widget's cleanup runs before its siblings have
  // registered, so a synchronous check would see a premature zero.
  setTimeout(() => {
    if (revealed || pending > 0) return
    revealed = true
    // No artificial minimum: the splash goes as soon as the route and its
    // data are ready. With a warm cache that's roughly the bundle parse +
    // first paint (~600 ms max), with nothing added on top.
    remove()
  }, 0)
}

function done() {
  pending = Math.max(0, pending - 1)
  settle()
}

// The splash sits in index.html so it paints before the CSS and JS bundles
// land. Drop it once the route and the data it displays are both ready, with
// no added delay.
export function revealRoute() {
  done()
}

// Hold the splash while `loading` is true, so it stays up until this widget has
// its data. Unmounting settles the count too, which is what keeps it correct
// under StrictMode's mount/unmount/mount and on route changes.
export function useSplashTask(loading: boolean) {
  useEffect(() => {
    if (!loading) return
    pending++
    return () => done()
  }, [loading])
}
