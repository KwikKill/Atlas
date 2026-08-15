import { NextResponse } from "next/server"
import type { CountryData } from "@/lib/types"

// The legacy restcountries.com v3.1 API was shut down; v5 requires an API key
// and is metered, so results are cached for a while to avoid burning through
// the request quota on every visitor. See https://restcountries.com/docs/countries
const API_BASE = "https://api.restcountries.com/countries/v5"
const PAGE_SIZE = 100
const CACHE_SECONDS = 21600 // 6h

const RESPONSE_FIELDS = [
  "names.common",
  "names.official",
  "codes.alpha_3",
  "coordinates.lat",
  "coordinates.lng",
  "capitals.name",
  "population",
  "region",
  "subregion",
  "flag.emoji",
  "flag.url_svg",
  "flag.url_png",
  "currencies",
  "languages",
  "borders",
  "area.kilometers",
  "links.google_maps",
  "timezones",
].join(",")

interface RestCountryV5 {
  names?: { common?: string; official?: string }
  codes?: { alpha_3?: string }
  coordinates?: { lat?: number; lng?: number }
  capitals?: { name?: string }[]
  population?: number
  region?: string
  subregion?: string
  flag?: { emoji?: string; url_svg?: string; url_png?: string }
  currencies?: { code?: string; name?: string; symbol?: string }[]
  languages?: { bcp47?: string; iso639_3?: string; name?: string }[]
  borders?: string[]
  area?: { kilometers?: number }
  links?: { google_maps?: string }
  timezones?: string[]
}

async function fetchPage(offset: number): Promise<{ objects: RestCountryV5[]; more: boolean }> {
  const apiKey = process.env.RESTCOUNTRIES_API_KEY
  if (!apiKey) {
    throw new Error("RESTCOUNTRIES_API_KEY is not configured")
  }

  const url = `${API_BASE}?response_fields=${RESPONSE_FIELDS}&limit=${PAGE_SIZE}&offset=${offset}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: CACHE_SECONDS },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`restcountries API request failed (${response.status}): ${body}`)
  }

  const json = await response.json()
  return { objects: json.data.objects as RestCountryV5[], more: json.data.meta.more as boolean }
}

function mapCountry(country: RestCountryV5): CountryData | null {
  const cca3 = country.codes?.alpha_3
  // A handful of disputed territories (Abkhazia, Somaliland, ...) have no ISO
  // alpha-3 code; skip them since the rest of the app keys everything on cca3.
  if (!cca3) return null

  return {
    name: {
      common: country.names?.common ?? "",
      official: country.names?.official ?? "",
    },
    cca3,
    latlng:
      country.coordinates?.lat !== undefined && country.coordinates?.lng !== undefined
        ? [country.coordinates.lat, country.coordinates.lng]
        : undefined,
    capital: (country.capitals ?? []).map((c) => c.name).filter((name): name is string => Boolean(name)),
    population: country.population,
    region: country.region,
    subregion: country.subregion,
    flag: country.flag?.emoji,
    flags: {
      svg: country.flag?.url_svg,
      png: country.flag?.url_png,
    },
    currencies: Object.fromEntries(
      (country.currencies ?? [])
        .filter((c) => c.code)
        .map((c) => [c.code as string, { name: c.name ?? "", symbol: c.symbol ?? "" }]),
    ),
    languages: Object.fromEntries(
      (country.languages ?? [])
        .filter((l) => l.bcp47 || l.iso639_3)
        .map((l) => [(l.bcp47 || l.iso639_3) as string, l.name ?? ""]),
    ),
    borders: country.borders,
    area: country.area?.kilometers,
    maps: {
      googleMaps: country.links?.google_maps,
    },
    timezones: country.timezones,
  }
}

export async function GET() {
  try {
    const raw: RestCountryV5[] = []
    let offset = 0
    let more = true

    while (more) {
      const page = await fetchPage(offset)
      raw.push(...page.objects)
      more = page.more
      offset += PAGE_SIZE
    }

    const countries = raw.map(mapCountry).filter((c): c is CountryData => c !== null)

    return NextResponse.json(countries)
  } catch (error) {
    console.error("Error fetching countries from restcountries API:", error)
    return NextResponse.json({ error: "Failed to load country data" }, { status: 502 })
  }
}
