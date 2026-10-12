import { Link } from "react-router"
import { DOCS, type DocId } from "../docs"

const PILL = "rounded-full px-3.5 py-2 text-sm font-medium transition-colors"

export function LegalNav({ doc }: { doc: DocId }) {
  return (
    <nav aria-label="Documents légaux" className="flex flex-wrap gap-2">
      {DOCS.map((entry) =>
        entry.id === doc ? (
          <span
            key={entry.id}
            aria-current="page"
            className={`${PILL} bg-accent text-foreground`}
          >
            {entry.label}
          </span>
        ) : (
          <Link
            key={entry.id}
            to={entry.path}
            className={`${PILL} border hover:bg-accent hover:text-foreground`}
          >
            {entry.label}
          </Link>
        )
      )}
    </nav>
  )
}
