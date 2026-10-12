import { getFriendlyErrorMessage } from "lowdirecte"

export function errorMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: string } | null)?.code
  if (code) return getFriendlyErrorMessage(code, fallback)
  return err instanceof Error ? err.message : fallback
}
