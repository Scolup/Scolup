// Le service worker garde le squelette de l'app (HTML, JS, CSS, polices,
// icônes) dans le cache : démarrage instantané, moins de trafic sur nos
// serveurs, et l'app s'ouvre encore sans réseau.
//
// La mise à jour, elle, reste pilotée par l'utilisateur : le pop-up compare
// les releases GitHub à la version locale, et son bouton « Mettre à jour »
// demande au nouveau worker de prendre le relais avant de recharger la page.

const SW_URL = "/sw.js"
const SW_SCOPE = "/"

// Le navigateur peut mettre du temps à aller chercher le nouveau worker.
const DOWNLOAD_TIMEOUT_MS = 10_000
// Une fois téléchargé, il doit s'activer presque immédiatement.
const ACTIVATION_TIMEOUT_MS = 5_000

export function registerServiceWorker(): void {
  // En dev, le worker casserait le HMR : on ne l'enregistre qu'en production.
  if (!import.meta.env.PROD) return
  if (!("serviceWorker" in navigator)) return
  navigator.serviceWorker
    .register(SW_URL, { scope: SW_SCOPE })
    .catch((error) => {
      console.warn("Service worker : enregistrement impossible", error)
    })
}

// Télécharge le nouveau worker en arrière-plan, pour que le bouton
// « Mettre à jour » soit instantané quand l'utilisateur l'appuie.
export async function prepareUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return
  try {
    await registration.update()
  } catch {
    // Hors ligne : rien à préparer.
  }
}

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForInstalled(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    // Déjà installé : pas d'événement à attendre.
    if (
      worker.state === "installed" ||
      worker.state === "activated" ||
      worker.state === "redundant"
    ) {
      resolve()
      return
    }
    const onStateChange = () => {
      if (
        worker.state === "installed" ||
        worker.state === "activated" ||
        worker.state === "redundant"
      ) {
        worker.removeEventListener("statechange", onStateChange)
        resolve()
      }
    }
    worker.addEventListener("statechange", onStateChange)
  })
}

// Renvoie le nouveau worker s'il est prêt à prendre le relais, null sinon.
async function findNewWorker(
  registration: ServiceWorkerRegistration
): Promise<ServiceWorker | null> {
  // Un worker en attente a déjà été téléchargé : il peut prendre le relais
  // tout de suite.
  if (registration.waiting) return registration.waiting

  // Rien en attente : on demande au navigateur d'aller chercher la nouvelle
  // version du worker.
  try {
    await Promise.race([registration.update(), timeout(DOWNLOAD_TIMEOUT_MS)])
  } catch {
    return null // Hors ligne : le worker actuel reste en place.
  }

  const worker = registration.waiting ?? registration.installing
  if (!worker) return null
  await Promise.race([waitForInstalled(worker), timeout(DOWNLOAD_TIMEOUT_MS)])

  // Seul un worker en attente peut prendre le relais : à la toute première
  // installation, il s'active tout seul.
  return registration.waiting
}

// Met le cache à jour et recharge l'app depuis ce nouveau cache.
export async function applyUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    window.location.reload()
    return
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    window.location.reload()
    return
  }

  const worker = await findNewWorker(registration)
  if (!worker) {
    // Aucun nouveau build à récupérer : le cache sert la version actuelle.
    window.location.reload()
    return
  }

  // Le nouveau worker s'active et prend le relais, la page repart du cache
  // tout neuf.
  await Promise.race([
    new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => resolve(),
        { once: true }
      )
      worker.postMessage({ type: "SKIP_WAITING" })
    }),
    timeout(ACTIVATION_TIMEOUT_MS),
  ])

  window.location.reload()
}
