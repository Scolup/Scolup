// Texte nettoyé, ou chaîne vide si la valeur n'est pas un texte.
export function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
