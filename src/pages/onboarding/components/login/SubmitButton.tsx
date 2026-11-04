import { m } from "motion/react"
import { Button } from "@/components/ui/button"

export function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <Button
      type="submit"
      disabled={submitting}
      className="relative overflow-hidden disabled:cursor-not-allowed"
    >
      {submitting ? (
        <span className="flex items-center gap-2">
          <m.span
            className="inline-block size-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          Connexion…
        </span>
      ) : (
        "Se connecter"
      )}
    </Button>
  )
}
