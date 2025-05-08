"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the EnhancedGlobe component to avoid SSR issues with Three.js
const EnhancedGlobe = dynamic(() => import("@/components/enhanced-globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">Loading globe...</span>
    </div>
  ),
})

export default function EnhancedPage() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all")
        if (!response.ok) {
          throw new Error("Failed to fetch countries")
        }
        const data = await response.json()
        setCountries(data)
      } catch (error) {
        console.error("Error fetching countries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2">Loading country data...</span>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <Suspense fallback={<div className="text-white">Loading globe...</div>}>
        <EnhancedGlobe countries={countries} />
      </Suspense>
    </main>
  )
}
