export interface CountryData {
  name: {
    common: string
    official: string
    nativeName?: {
      [key: string]: {
        official: string
        common: string
      }
    }
  }
  tld?: string[]
  cca2: string
  ccn3?: string
  cca3: string
  cioc?: string
  independent?: boolean
  status?: string
  unMember?: boolean
  currencies?: {
    [key: string]: {
      name: string
      symbol: string
    }
  }
  idd?: {
    root: string
    suffixes: string[]
  }
  capital?: string[]
  altSpellings?: string[]
  region?: string
  subregion?: string
  languages?: {
    [key: string]: string
  }
  latlng?: number[]
  landlocked?: boolean
  borders?: string[]
  area?: number
  demonyms?: {
    eng?: {
      f: string
      m: string
    }
    fra?: {
      f: string
      m: string
    }
  }
  flag?: string
  maps?: {
    googleMaps?: string
    openStreetMaps?: string
  }
  population?: number
  gini?: {
    [key: string]: number
  }
  fifa?: string
  car?: {
    signs?: string[]
    side?: string
  }
  timezones?: string[]
  continents?: string[]
  flags?: {
    png?: string
    svg?: string
    alt?: string
  }
  coatOfArms?: {
    png?: string
    svg?: string
  }
  startOfWeek?: string
  capitalInfo?: {
    latlng?: number[]
  }
  postalCode?: {
    format?: string
    regex?: string
  }
}

export interface GeoJSONFeature {
  type: string
  properties: {
    scalerank: number
    labelrank: number
    sovereignt: string
    sov_a3: string
    adm0_dif: number
    level: number
    type: string
    admin: string
    adm0_a3: string
    geou_dif: number
    geounit: string
    gu_a3: string
    su_dif: number
    subunit: string
    su_a3: string
    brk_diff: number
    name: string
    name_long: string
    brk_a3: string
    brk_name: string
    brk_group: string | null
    abbrev: string
    postal: string
    formal_en: string
    formal_fr: string | null
    note_adm0: string | null
    note_brk: string | null
    name_sort: string
    name_alt: string | null
    mapcolor7: number
    mapcolor8: number
    mapcolor9: number
    mapcolor13: number
    pop_est: number
    gdp_md_est: number
    pop_year: number
    lastcensus: number
    gdp_year: number
    economy: string
    income_grp: string
    wikipedia: number
    fips_10: string | null
    iso_a2: string
    iso_a3: string
    iso_n3: string
    un_a3: string
    wb_a2: string
    wb_a3: string
    woe_id: number
    adm0_a3_is: string
    adm0_a3_us: string
    adm0_a3_un: number
    adm0_a3_wb: number
    continent: string
    region_un: string
    subregion: string
    region_wb: string
    name_len: number
    long_len: number
    abbrev_len: number
    tiny: number
    homepart: number
    featureclass: string
  }
  geometry: {
    type: string
    coordinates: any[]
  }
}

export interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
}
