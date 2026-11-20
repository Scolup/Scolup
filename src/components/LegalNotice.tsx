import { Link } from "react-router"
import { m } from "motion/react"
import { fadeUp } from "@/lib/motion"

export function LegalNotice() {
  return (
    <m.p
      variants={fadeUp()}
      className="px-6 text-center text-sm leading-normal font-normal text-muted-foreground"
    >
      En continuant, tu acceptes nos{" "}
      <Link
        to="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-primary-text"
      >
        Conditions d'utilisation
      </Link>{" "}
      et notre{" "}
      <Link
        to="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-primary-text"
      >
        Politique de confidentialité
      </Link>
      .<br />{" "}
      <em>Si tu as moins de 15 ans, demande à tes parents ou tuteurs.</em>
    </m.p>
  )
}
