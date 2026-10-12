export const DOCS = [
  { id: "terms", path: "/terms", label: "Conditions d'utilisation" },
  { id: "privacy", path: "/privacy", label: "Confidentialité" },
  { id: "security", path: "/security", label: "Sécurité" },
  { id: "mentions", path: "/mentions", label: "Mentions légales" },
] as const

export type DocId = (typeof DOCS)[number]["id"]
