import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { extractFacts } from "../src/pages/learn/generation/extract"
import type { Fact } from "../src/pages/learn/generation/facts"
import { normalizeText } from "../src/pages/learn/generation/normalize"

function course(name: string) {
  const url = new URL(`./fixtures/courses/${name}.txt`, import.meta.url)
  return readFileSync(url, "utf8")
}

function factsOf<Kind extends Fact["kind"]>(text: string, kind: Kind) {
  return extractFacts(text).filter(
    (fact): fact is Extract<Fact, { kind: Kind }> => fact.kind === kind
  )
}

describe("Nettoyage du texte d’un cours", () => {
  test("recolle les lignes coupées par la largeur de la page", () => {
    const text = normalizeText(course("unites"))
    expect(text).toContain("entre le Soleil et la Terre, soit environ 150")
    expect(text).toContain("distances dans l’Univers.")
    expect(text).toContain(
      "Une année lumière est la distance que parcourt la lumière"
    )
  })

  test("ne recolle pas les lignes d’une liste de vocabulaire", () => {
    expect(normalizeText(course("metiers")).split("\n")).toHaveLength(4)
  })

  test("uniformise les puces, les espaces et les fins de ligne Windows", () => {
    const messy = "− un\r\n–\u00A0deux\r\n·   trois\r\n\r\n•\r\n"
    expect(normalizeText(messy)).toBe("• un\n• deux\n• trois")
  })

  test("rétablit une puissance de dix quand le texte la confirme en toutes lettres", () => {
    const text = normalizeText(course("unites"))
    expect(text).toContain("(1 U.A = 1,5 × 10⁸ km)")
    expect(text).toContain("9,5 × 10¹² km (environ 10¹³ km)")
  })

  test("laisse intacte une puissance qu’il ne peut pas vérifier", () => {
    const unchecked = "La lumière va à environ 3 x 108 m/s."
    expect(normalizeText(unchecked)).toBe(unchecked)
    const product = "On calcule 4 x 100 puis 150 millions de km."
    expect(normalizeText(product)).toBe(product)
    // Le texte en toutes lettres dit 10⁸, pas 10⁹.
    const contradicted = "Environ 150 millions de km, soit 1,5 x 109 km."
    expect(normalizeText(contradicted)).toBe(contradicted)
  })
})

describe("Extraction des faits", () => {
  test("extrait la définition de l’année lumière et rien d’autre du cours d’unités", () => {
    const facts = extractFacts(course("unites"))
    expect(facts).toHaveLength(1)
    expect(facts[0]).toMatchObject({
      kind: "definition",
      term: "Une année lumière",
      definition:
        "la distance que parcourt la lumière (dans le vide) en une année",
    })
  })

  test("relie chaque question à sa réponse, sans l’exemple", () => {
    const [first, second] = factsOf(course("pouvoirs"), "question")
    expect(first.question).toBe(
      "Comment la Constitution protège-t-elle la démocratie ?"
    )
    expect(
      first.answer.split("\n").filter((line) => line.startsWith("• "))
    ).toHaveLength(3)
    expect(second.answer).toContain("1958")
    expect(second.answer).not.toContain("Exemple")
  })

  test("lit les puces « le pouvoir … qui … » comme des définitions", () => {
    const definitions = factsOf(course("pouvoirs"), "definition")
    expect(definitions.map((fact) => fact.term)).toEqual([
      "Le pouvoir législatif",
      "Le pouvoir exécutif",
      "Le pouvoir judiciaire",
    ])
    expect(definitions[1].definition).toBe("qui applique les lois votées")
  })

  test("retrouve les huit paires d’une liste de vocabulaire collée sur une ligne", () => {
    const pairs = factsOf(course("metiers"), "pair")
    expect(pairs.map(({ left, right }) => [left, right])).toEqual([
      ["psy", "therapist"],
      ["costumier", "costume designer"],
      ["artiste de rue", "street performer"],
      ["magon", "construction worker"],
      ["infirmier", "nurse"],
      ["orthoptiste", "optometrist"],
      ["thanatopracteur", "mortician"],
      ["homme de sciences", "scholar"],
    ])
  })

  test("préfère ignorer une ligne collée plutôt que d’inventer des paires", () => {
    // Des verbes en -er ressemblent à de l’anglais : le sens de la liste est
    // trop incertain pour couper la première ligne.
    const text =
      "chanter = to sing danser = to dance manger = to eat\nparler = to speak"
    const pairs = factsOf(text, "pair")
    expect(pairs.map(({ left, right }) => [left, right])).toEqual([
      ["parler", "to speak"],
    ])
  })

  test("lit une liste de vocabulaire dans les deux sens", () => {
    const text =
      "to sing = chanter to dance = danser to eat = manger\nthe baker = le boulanger"
    expect(factsOf(text, "pair")).toHaveLength(4)
  })

  test("lit un tableau copié depuis un tableur (tabulations)", () => {
    const pairs = factsOf("chat\tcat\nchien\tdog\ncheval\thorse", "pair")
    expect(pairs.map(({ left, right }) => [left, right])).toEqual([
      ["chat", "cat"],
      ["chien", "dog"],
      ["cheval", "horse"],
    ])
  })

  test("ne prend ni les formules ni les mesures pour du vocabulaire", () => {
    const formulas =
      "Aire = longueur × largeur\nVitesse = distance / temps\nPérimètre = côtés ajoutés"
    expect(factsOf(formulas, "pair")).toEqual([])
    expect(factsOf("Aire = longueur\nVitesse = distance", "pair")).toEqual([])
  })

  test("reconnaît « Terme : explication » et les libellés « Définition : »", () => {
    const text = [
      "Photosynthèse : fabrication de matière organique grâce à la lumière",
      "Définition : Une fraction est un quotient de deux nombres.",
      "Exemple : la photosynthèse des feuilles vertes en été",
    ].join("\n")
    expect(
      factsOf(text, "definition").map(({ term, definition }) => [
        term,
        definition,
      ])
    ).toEqual([
      ["Photosynthèse", "fabrication de matière organique grâce à la lumière"],
      ["Une fraction", "un quotient de deux nombres"],
    ])
  })

  test("garde une question sans numéro si elle commence par un mot interrogatif", () => {
    const text =
      "Pourquoi le ciel est-il bleu ?\nLa lumière du Soleil est diffusée par l’atmosphère."
    expect(factsOf(text, "question")).toHaveLength(1)
  })

  test("ne trouve rien dans un texte sans structure", () => {
    expect(extractFacts("")).toEqual([])
    expect(extractFacts("Bonjour à tous. Voici mon cours.")).toEqual([])
  })

  test("donne les mêmes faits sur un texte bruité par le copier-coller", () => {
    const clean = course("pouvoirs")
    const noisy = clean
      .replaceAll("\n", "\r\n")
      .replaceAll(" ?", "\u202F?")
      .replaceAll(" :", "\u00A0:")
      .replaceAll("pouvoir ", "pouvoir  ")
      .replaceAll("législatif", "légis\u00ADlatif")
    expect(extractFacts(noisy)).toEqual(extractFacts(clean))
  })
})
