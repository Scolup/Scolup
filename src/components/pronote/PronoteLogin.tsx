import { useCallback, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { School01Icon } from "@hugeicons/core-free-icons"
import type { School } from "litenote"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { connectPronote, PronoteConnectionError } from "@/services/litenote"
import { searchSchools } from "@/services/schoolDirectory"
import { pageTransitionVariants } from "@/lib/onboardingTransitions"
import { PronoteQrInput } from "./PronoteQrInput"
import { LegalNotice } from "@/components/LegalNotice"

export function PronoteLogin({
  initialSchool,
  onNext,
}: {
  initialSchool?: School
  onNext: () => void
}) {
  const [selected, setSelected] = useState(initialSchool)
  const [query, setQuery] = useState("")
  const [qr, setQr] = useState("")
  const [results, setResults] = useState<School[] | null>(null)
  const [error, setError] = useState("")
  const [searching, setSearching] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const searches = useRef(0)
  const secure = window.isSecureContext
  const updateQr = useCallback((value: string) => {
    setError("")
    setQr(value)
  }, [])

  async function search(value: string) {
    const id = ++searches.current
    const isCurrent = () => searches.current === id
    setSearching(true)
    setError("")
    setResults(null)
    try {
      const schools = await searchSchools(value)
      if (isCurrent()) setResults(schools)
    } catch {
      if (isCurrent())
        setError("La recherche est indisponible. Réessaie dans un instant.")
    } finally {
      if (isCurrent()) setSearching(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !qr || connecting || !secure) return
    const pin = new FormData(event.currentTarget).get("pin")
    if (typeof pin !== "string") return
    setConnecting(true)
    setError("")
    try {
      await connectPronote(qr, pin, selected.url)
      onNext()
    } catch (failure) {
      setError(
        failure instanceof PronoteConnectionError
          ? failure.message
          : "L’association PRONOTE a échoué. Réessaie dans un instant."
      )
    } finally {
      setConnecting(false)
    }
  }

  const screen = selected ? (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{selected.name}</h1>
      <Button
        nativeButton={false}
        render={
          <a href={selected.url} target="_blank" rel="noopener noreferrer" />
        }
        className="min-h-11 sm:min-h-0"
      >
        Ouvrir PRONOTE ou l’ENT
      </Button>
      <p className="text-sm text-muted-foreground">
        Dans ton espace élève PRONOTE, ouvre l’icône QR près de ton nom et
        choisis un code à quatre chiffres. Scanne ensuite le QR code ou importe
        une capture.
      </p>
      {!secure && (
        <p role="alert" className="text-sm text-destructive">
          La connexion PRONOTE demande une adresse HTTPS. En dev, ouvre{" "}
          <a href="http://localhost:2326" className="underline">
            localhost:2326
          </a>{" "}
          sur le PC qui lance Scolup.
        </p>
      )}
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <PronoteQrInput
          portal={selected.url}
          value={qr}
          onRead={updateQr}
          disabled={connecting || !secure}
        />
        <Field className="gap-2">
          <FieldLabel htmlFor="pronote-pin">Code à quatre chiffres</FieldLabel>
          <Input
            id="pronote-pin"
            className="h-11 sm:h-8"
            name="pin"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            disabled={connecting || !secure}
            required
          />
        </Field>
        <Button
          type="submit"
          disabled={connecting || !qr || !secure}
          className="min-h-11 sm:min-h-0"
        >
          {connecting ? "Association…" : "Associer mon compte"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!initialSchool && (
        <Button
          variant="ghost"
          disabled={connecting}
          className="min-h-11 sm:min-h-0"
          onClick={() => {
            setSelected(undefined)
            setQr("")
            setError("")
          }}
        >
          Changer d’établissement
        </Button>
      )}
    </section>
  ) : (
    <section className="flex flex-col gap-3">
      <div className="mb-3 flex flex-col items-center gap-4 text-center">
        <span className="grid size-8 place-items-center">
          <HugeiconsIcon
            icon={School01Icon}
            strokeWidth={2}
            className="size-6"
            aria-hidden="true"
          />
        </span>
        <h1 className="text-xl font-bold">Trouve ton établissement</h1>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          const value = query.trim()
          if (value.length > 1) void search(value)
        }}
      >
        <Field>
          <FieldLabel htmlFor="pronote-school">Établissement</FieldLabel>
          <Input
            id="pronote-school"
            placeholder="Ville, code postal ou établissement"
            value={query}
            className="h-11 sm:h-8"
            required
            onChange={(event) => {
              searches.current++
              setQuery(event.target.value)
              setSearching(false)
              setResults(null)
              setError("")
            }}
          />
        </Field>
        <Button type="submit" className="min-h-11 sm:min-h-0">
          Chercher
        </Button>
      </form>
      {searching && (
        <p role="status" className="text-sm text-muted-foreground">
          Recherche en cours…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {results?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun établissement PRONOTE hébergé trouvé.
        </p>
      )}
      {!!results?.length && (
        <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {results.map((school) => (
            <li key={school.url}>
              <Button
                variant="outline"
                className="min-h-11 w-full justify-between gap-2 text-left sm:min-h-0"
                onClick={() => setSelected(school)}
              >
                <span className="truncate">{school.name}</span>
                <span className="text-muted-foreground">
                  {school.postalCode}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  const direction = selected ? 1 : -1
  return (
    <AnimatePresence initial={false} mode="wait" custom={direction}>
      <m.div
        key={selected ? "pair" : "search"}
        className="flex flex-col gap-6"
        custom={direction}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {screen}
        <LegalNotice />
      </m.div>
    </AnimatePresence>
  )
}
