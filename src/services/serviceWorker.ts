// Le service worker garde le squelette de l'app (HTML, JS, CSS, polices,
// icônes) dans le cache : démarrage instantané, moins de trafic sur nos
// serveurs, et l'app s'ouvre encore sans réseau.
//
// À chaque ouverture, on lui demande de chercher une nouvelle version. Le
// nouveau worker prend le relais tout seul (skipWaiting) et la page se
// recharge alors pour servir le cache à jour.

const SW_URL = "/sw.js"
const SW_SCOPE = "/"

export function registerServiceWorker(): void {
  // En dev, le worker casserait le HMR : on ne l'enregistre qu'en production.
  if (!import.meta.env.PROD) return
  if (!("serviceWorker" in navigator)) return

  // Au premier chargement, le worker prend le contrôle de la page : ce n'est
  // pas une mise à jour, inutile de recharger. Ensuite, tout nouveau worker
  // qui prend le relais est une mise à jour : on recharge sur le cache neuf.
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload()
    })
  }

  navigator.serviceWorker
    .register(SW_URL, { scope: SW_SCOPE })
    .then((registration) => {
      // Cherche une nouvelle version à chaque ouverture de l'app.
      registration.update().catch(() => {
        // Hors ligne : la version en cache reste en place.
      })
    })
    .catch((error) => {
      console.warn("Service worker : enregistrement impossible", error)
    })
}
