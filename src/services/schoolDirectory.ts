import { nearbySchools, type Position, type School } from "litenote"

const communes = "https://geo.api.gouv.fr/communes"
const directory =
  "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records"
type City = { nom: string; centre?: { coordinates: [number, number] } }
type Establishment = Position & { code_postal: string }
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

async function read<T>(url: string, params: URLSearchParams): Promise<T> {
  const response = await fetch(url + "?" + params.toString(), {
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) throw new Error("L’annuaire est indisponible.")
  return response.json() as Promise<T>
}

async function collect(requests: Promise<School[]>[]) {
  const responses = await Promise.allSettled(requests)
  const successes = responses.filter((r) => r.status === "fulfilled")
  if (responses.length && !successes.length)
    throw new Error("L’annuaire PRONOTE est indisponible.")
  return Array.from(
    new Map(
      successes.flatMap((r) => r.value).map((school) => [school.url, school])
    ).values()
  ).slice(0, 18)
}

export async function searchSchools(query: string): Promise<School[]> {
  const cities = await read<City[]>(
    communes,
    new URLSearchParams({
      [/^\d{5}$/.test(query) ? "codePostal" : "nom"]: query,
      fields: "nom,centre",
      limit: "4",
    })
  ).catch(() => [])
  const positions = cities.flatMap((city) =>
    city.centre ? [city.centre.coordinates] : []
  )
  if (positions.length)
    return collect(
      positions.map(([longitude, latitude]) =>
        nearbySchools({ latitude, longitude })
      )
    )
  const name = query.replace(/[^\p{L}\p{N} '-]/gu, "").trim()
  if (!name) return []
  const { results } = await read<{ results: Establishment[] }>(
    directory,
    new URLSearchParams({
      where: 'search(nom_etablissement, "' + name + '") AND etat = "OUVERT"',
      select: "latitude,longitude,code_postal",
      limit: "5",
    })
  )
  return collect(
    results
      .filter(
        (row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
      )
      .map(async (row) =>
        (await nearbySchools(row)).filter(
          (school) =>
            school.postalCode === row.code_postal ||
            normalize(school.name).includes(normalize(name))
        )
      )
  )
}
