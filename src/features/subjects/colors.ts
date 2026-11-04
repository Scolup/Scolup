const SUBJECT_COLORS = [
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#EAB308",
  "#65A30D",
  "#16A34A",
  "#059669",
  "#0D9488",
  "#0891B2",
  "#0284C7",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#C026D3",
  "#DB2777",
  "#E11D48",
  "#92400E",
  "#475569",
]

export function seedColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

export const SUBJECT_PICKER_COLORS = [...SUBJECT_COLORS]

export function isSubjectColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
}
