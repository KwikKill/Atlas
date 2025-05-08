"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { CountryData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CountrySidebarProps {
  country: CountryData | null
  onClose: () => void
  isOpen: boolean
}

export default function CountrySidebar({ country, onClose, isOpen }: CountrySidebarProps) {
  const [mounted, setMounted] = useState(false)

  // Handle animation mounting
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const timer = setTimeout(() => {
        setMounted(false)
      }, 300) // Match the transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!mounted && !isOpen) {
    return null
  }

  if (!country) {
    return null
  }

  // Get the common name and official name
  const commonName = country.name.common
  const officialName = country.name.official

  // Get the capital(s)
  const capitals = country.capital ? country.capital.join(", ") : "N/A"

  // Get the population with formatting
  const population = country.population ? new Intl.NumberFormat().format(country.population) : "N/A"

  // Get the region and subregion
  const region = country.region || "N/A"
  const subregion = country.subregion || "N/A"

  // Get the flag emoji and image
  const flagEmoji = country.flag || ""
  const flagImage = country.flags?.svg || country.flags?.png || ""

  // Get the currency information
  let currencyInfo = "N/A"
  if (country.currencies) {
    const currencyEntries = Object.entries(country.currencies)
    if (currencyEntries.length > 0) {
      currencyInfo = currencyEntries
        .map(([code, details]) => {
          return `${details.name} (${details.symbol || code})`
        })
        .join(", ")
    }
  }

  // Get languages
  let languageInfo = "N/A"
  if (country.languages) {
    languageInfo = Object.values(country.languages).join(", ")
  }

  // Get borders
  let bordersInfo = "N/A"
  if (country.borders && country.borders.length > 0) {
    bordersInfo = country.borders.join(", ")
  }

  // Get area with formatting
  const area = country.area ? `${new Intl.NumberFormat().format(country.area)} km²` : "N/A"

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-full sm:w-96 bg-background shadow-lg z-50 overflow-y-auto transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="sticky top-0 bg-accent border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{flagEmoji}</span>
            <div>
              <h2 className="font-bold text-xl">{commonName}</h2>
              <p className="text-xs text-gray-500 italic">{officialName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {flagImage && (
          <div className="border rounded overflow-hidden">
            <img
              src={flagImage || "/placeholder.svg"}
              alt={`Flag of ${commonName}`}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 bg-accent p-3 rounded-lg text-center">
              <div className="text-sm text-gray-500">Population</div>
              <div className="font-semibold mt-1">{population}</div>
            </div>
            <div className="col-span-1 bg-accent p-3 rounded-lg text-center">
              <div className="text-sm text-gray-500">Area</div>
              <div className="font-semibold mt-1">{area}</div>
            </div>
            <div className="col-span-1 bg-accent p-3 rounded-lg text-center">
              <div className="text-sm text-gray-500">Region</div>
              <div className="font-semibold mt-1">{region}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Details</h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="text-gray-500">Capital</div>
            <div className="font-medium">{capitals}</div>

            <div className="text-gray-500">Subregion</div>
            <div className="font-medium">{subregion}</div>

            <div className="text-gray-500">Currency</div>
            <div className="font-medium break-words">{currencyInfo}</div>

            <div className="text-gray-500">Languages</div>
            <div className="font-medium break-words">{languageInfo}</div>

            <div className="text-gray-500">Borders</div>
            <div className="font-medium break-words">{bordersInfo}</div>
          </div>
        </div>

        {country.maps?.googleMaps && (
          <div className="pt-4">
            <a
              href={country.maps.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded transition-colors"
            >
              View on Google Maps
            </a>
          </div>
        )}

        {country.timezones && country.timezones.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold border-b pb-2">Timezones</h3>
            <div className="flex flex-wrap gap-2">
              {country.timezones.map((timezone, index) => (
                <span key={index} className="bg-accent px-2 py-1 rounded text-sm">
                  {timezone}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
