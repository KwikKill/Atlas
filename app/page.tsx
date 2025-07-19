"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the Globe component to avoid SSR issues with Three.js
const Globe = dynamic(() => import("@/components/enhanced-globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">Loading globe...</span>
    </div>
  ),
})

export default function Home() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca3,latlng,capital,population,region,subregion,flag,flags,currencies")
        if (!response.ok) {
          throw new Error("Failed to fetch countries")
        }
        const data = await response.json()

        const response2 = await fetch("https://restcountries.com/v3.1/all?fields=cca3,languages,borders,area,maps,timezones")
        if (!response2.ok) {
          throw new Error("Failed to fetch countries")
        }
        // merge the two responses using cca3 as the key
        const data2 = await response2.json()
        const mergedData = data.map((country: any) => {
          const additionalData = data2.find((c: any) => c.cca3 === country.cca3)
          return { ...country, ...additionalData }
        })
        setCountries(mergedData)
        console.log("Loaded", data.length, "countries")
      } catch (error) {
        console.error("Error fetching countries:", error)
        setError("Failed to load country data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2">Loading country data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center flex-col bg-black text-white">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md">
          Retry
        </button>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <div className="absolute top-4 left-4 z-10 text-white bg-accent/50 p-2 rounded-md text-sm border border-gray-700">
        Click on a yellow dot to view country information
      </div>
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-black text-white">Loading globe...</div>
        }
      >
        <Globe countries={countries} />
      </Suspense>
      <div className="absolute bottom-4 right-4 z-10 text-white bg-accent/50 p-2 rounded-md text-sm border border-gray-700">
        Atlas - Interactive World Map by KwikKill
      </div>
    </main>
  )
}
