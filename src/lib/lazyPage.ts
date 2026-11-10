import { lazy, type ComponentType } from "react"

// Charge un écran à la demande. Nos écrans sont exportés par leur nom
// (`export function Grades`), alors que `lazy` attend un export `default` :
// ce petit utilitaire fait la conversion.
// `any` vient de la signature de `lazy` de React, qui l'utilise aussi.
type AnyComponent = ComponentType<any>

export function lazyPage<
  Name extends string,
  Module extends Record<Name, AnyComponent>,
>(load: () => Promise<Module>, name: Name) {
  return lazy(() => load().then((module) => ({ default: module[name] })))
}
