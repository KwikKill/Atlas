"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useTexture, Stars } from "@react-three/drei"
import * as THREE from "three"
import CountrySidebar from "./country-sidebar"
import ControlPanel from "./control-panel"
import type { CountryData } from "@/lib/types"

// Space background component using a much larger sphere
function SpaceBackground() {
  const { scene } = useThree()

  useEffect(() => {
    // Load the space texture
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load("/space.png", (texture) => {
      // Create a large sphere with the texture on the inside
      const geometry = new THREE.SphereGeometry(5000, 32, 32)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide, // Render the inside of the sphere
      })
      const spaceSphere = new THREE.Mesh(geometry, material)
      scene.add(spaceSphere)
    })

    // Cleanup function
    return () => {
      const spaceSphere = scene.children.find(
        (child) =>
          child instanceof THREE.Mesh &&
          child.geometry instanceof THREE.SphereGeometry &&
          child.geometry.parameters.radius === 5000,
      )
      if (spaceSphere) {
        scene.remove(spaceSphere)
      }
    }
  }, [scene])

  return null
}

// Convert latitude and longitude to 3D coordinates on a sphere
function latLongToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}

// Country borders component that adds borders to the parent group
function CountryBorders() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson",
        )
        const data = await response.json()

        // Create a geometry to hold all line segments
        const geometry = new THREE.BufferGeometry()
        const vertices: number[] = []

        // Process each country feature
        data.features.forEach((feature: any) => {
          if (feature.geometry.type === "Polygon") {
            // Process each polygon ring
            feature.geometry.coordinates.forEach((ring: number[][]) => {
              // Process each point in the ring
              for (let i = 0; i < ring.length - 1; i++) {
                const [lon1, lat1] = ring[i]
                const [lon2, lat2] = ring[i + 1]

                // Convert to 3D coordinates (slightly above Earth surface)
                const v1 = latLongToVector3(lat1, lon1, 100.1)
                const v2 = latLongToVector3(lat2, lon2, 100.1)

                // Add to vertices array
                vertices.push(v1.x, v1.y, v1.z)
                vertices.push(v2.x, v2.y, v2.z)
              }
            })
          } else if (feature.geometry.type === "MultiPolygon") {
            // Process each polygon in the multi-polygon
            feature.geometry.coordinates.forEach((polygon: number[][][]) => {
              // Process each ring in the polygon
              polygon.forEach((ring: number[][]) => {
                // Process each point in the ring
                for (let i = 0; i < ring.length - 1; i++) {
                  const [lon1, lat1] = ring[i]
                  const [lon2, lat2] = ring[i + 1]

                  // Convert to 3D coordinates (slightly above Earth surface)
                  const v1 = latLongToVector3(lat1, lon1, 100.1)
                  const v2 = latLongToVector3(lat2, lon2, 100.1)

                  // Add to vertices array
                  vertices.push(v1.x, v1.y, v1.z)
                  vertices.push(v2.x, v2.y, v2.z)
                }
              })
            })
          }
        })

        // Set the vertices
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))

        // Create material and line segments
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        })

        if (linesRef.current) {
          // Update existing lines
          linesRef.current.geometry.dispose()
          linesRef.current.geometry = geometry
        } else if (groupRef.current) {
          // Create new lines
          const lines = new THREE.LineSegments(geometry, material)
          linesRef.current = lines
          groupRef.current.add(lines)
        }

        console.log(`Created border lines with ${vertices.length / 3} points`)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching or processing GeoJSON:", error)
        setError("Failed to load country borders")
        setLoading(false)
      }
    }

    fetchGeoJSON()

    // Cleanup
    return () => {
      if (linesRef.current && groupRef.current) {
        groupRef.current.remove(linesRef.current)
        linesRef.current.geometry.dispose()
        if (linesRef.current.material instanceof THREE.Material) {
          linesRef.current.material.dispose()
        } else if (Array.isArray(linesRef.current.material)) {
          linesRef.current.material.forEach((material) => material.dispose())
        }
      }
    }
  }, [])

  return <group ref={groupRef} />
}

// Country marker component
function CountryMarker({
  position,
  isHighlighted,
  isVisible,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  position: THREE.Vector3
  isHighlighted: boolean
  isVisible: boolean
  onClick: (e: THREE.Event) => void
  onPointerOver: (e: THREE.Event) => void
  onPointerOut: (e: THREE.Event) => void
}) {
  const markerRef = useRef<THREE.Group>(null)

  // Calculate direction from Earth center to marker position (normalized)
  const direction = useMemo(() => {
    return position.clone().normalize()
  }, [position])

  // Calculate quaternion to rotate the cone to point toward Earth center
  const quaternion = useMemo(() => {
    // Default direction for cone (pointing up along y-axis)
    const defaultDirection = new THREE.Vector3(0, 1, 0)

    // We want to rotate from the default direction to point toward Earth center
    // So we need to point in the opposite direction of the position vector
    const targetDirection = direction.clone().negate()

    // Create quaternion for rotation
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(defaultDirection, targetDirection)

    return quaternion
  }, [direction])

  // Cone size based on highlight state
  const radius = isHighlighted ? 1.5 : 1.2
  const height = isHighlighted ? 4 : 3

  return (
    <group
      ref={markerRef}
      position={position}
      quaternion={quaternion}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <mesh>
        <coneGeometry args={[radius, height, 12]} />
        <meshStandardMaterial
          color={isHighlighted ? "#ff9900" : "#ffcc00"}
          emissive={isHighlighted ? "#ff6600" : "#cc9900"}
          emissiveIntensity={0.5}
          opacity={isVisible ? 1 : 0} // Make invisible markers completely transparent
          transparent={true}
          visible={isVisible} // Hide invisible markers completely
        />
      </mesh>
    </group>
  )
}

// Multi-layered Earth component
function Earth({
  countries,
  onCountryClick,
  selectedCountry,
  rotationEnabled,
  sunlightEnabled,
}: {
  countries: CountryData[]
  onCountryClick: (country: CountryData) => void
  selectedCountry: CountryData | null
  rotationEnabled: boolean
  sunlightEnabled: boolean
}) {
  const earthGroupRef = useRef<THREE.Group>(null)
  const earthMeshRef = useRef<THREE.Mesh>(null)
  const cloudsMeshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const [hovered, setHovered] = useState<string | null>(null)
  const [visibleCountries, setVisibleCountries] = useState<Set<string>>(() => {
    // Start with all countries visible
    return new Set(countries.map((country) => country.cca3))
  })

  // Country marker refs to track positions
  const countryRefs = useRef<{ [key: string]: THREE.Group | null }>({})

  // Load earth textures
  const [albedoMap, bumpMap, oceanMap, cloudsMap] = useTexture([
    "/albedo.jpg",
    "/bump.jpg",
    "/ocean.png",
    "/clouds.png",
  ])

  // Set up textures
  useEffect(() => {
    // Set texture properties
    albedoMap.colorSpace = THREE.SRGBColorSpace

    // Set wrapping and repeat
    ;[albedoMap, bumpMap, oceanMap, cloudsMap].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    })
  }, [albedoMap, bumpMap, oceanMap, cloudsMap])

  // Set initial camera position
  useEffect(() => {
    camera.position.z = 300
  }, [camera])

  // Check if a country is visible from the camera's perspective
  const updateVisibleCountries = () => {
    if (!earthGroupRef.current) return

    const cameraPosition = new THREE.Vector3()
    camera.getWorldPosition(cameraPosition)

    // Direction from globe center to camera
    const cameraDirection = cameraPosition.clone().normalize()

    const newVisibleCountries = new Set<string>()

    // Check each country's visibility
    Object.entries(countryRefs.current).forEach(([countryId, groupRef]) => {
      if (groupRef) {
        const countryPosition = new THREE.Vector3()
        groupRef.getWorldPosition(countryPosition)

        // Direction from globe center to country
        const countryDirection = countryPosition.clone().normalize()

        // Dot product determines if country is on visible side
        // If dot product > 0, the country is on the same side as the camera
        const dotProduct = countryDirection.dot(cameraDirection)

        // Use a more lenient threshold to consider countries visible
        // This ensures countries near the edge are still visible
        if (dotProduct > -0.2) {
          newVisibleCountries.add(countryId)
        }
      }
    })

    setVisibleCountries(newVisibleCountries)
  }

  // Rotation animation
  useFrame(() => {
    if (earthGroupRef.current) {
      // Only rotate if rotation is enabled
      if (rotationEnabled) {
        // Rotate the entire earth group (including country markers and borders)
        earthGroupRef.current.rotation.y += 0.0005

        // Rotate clouds slightly faster for a dynamic effect
        if (cloudsMeshRef.current) {
          cloudsMeshRef.current.rotation.y += 0.0001
        }
      }

      updateVisibleCountries()
    }
  })

  // Get the selected country code
  const selectedCountryCode = selectedCountry?.cca3 || null

  return (
    // Use a group to contain both the Earth, country markers, and borders so they rotate together
    <group ref={earthGroupRef}>
      {/* Earth sphere with multi-layered textures */}
      <mesh ref={earthMeshRef}>
        <sphereGeometry args={[100, 64, 64]} />
        <meshPhysicalMaterial
          map={albedoMap}
          bumpMap={bumpMap}
          bumpScale={1}
          roughness={1}
          metalness={0.1}
          metalnessMap={oceanMap}
        />
      </mesh>

      {/* Country borders - now part of the Earth group */}
      <CountryBorders />

      {/* Cloud layer - slightly larger and rotates independently */}
      <mesh ref={cloudsMeshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[102, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Country markers - part of the same group as the Earth */}
      {countries.map((country) => {
        if (!country.latlng || country.latlng.length < 2) return null

        const position = latLongToVector3(country.latlng[0], country.latlng[1], 103)
        const isHovered = hovered === country.cca3
        const isSelected = selectedCountryCode === country.cca3
        const isVisible = visibleCountries.has(country.cca3)

        // Apply hover styling to both hovered and selected countries
        const isHighlighted = isHovered || isSelected

        return (
          <group key={country.cca3} ref={(el) => (countryRefs.current[country.cca3] = el)}>
            <CountryMarker
              position={position}
              isHighlighted={isHighlighted}
              isVisible={isVisible}
              onClick={(e) => {
                if (!isVisible) return
                (e as unknown as MouseEvent).stopPropagation()
                onCountryClick(country)
              }}
              onPointerOver={(e) => {
                if (!isVisible) return
                (e as unknown as MouseEvent).stopPropagation()
                setHovered(country.cca3)
                document.body.style.cursor = "pointer"
              }}
              onPointerOut={(e) => {
                if (!isVisible) return
                (e as unknown as MouseEvent).stopPropagation()
                setHovered(null)
                document.body.style.cursor = "auto"
              }}
            />
          </group>
        )
      })}
    </group>
  )
}

export default function EnhancedGlobe({ countries }: { countries: CountryData[] }) {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Add state for rotation and sunlight toggles
  const [rotationEnabled, setRotationEnabled] = useState(true)
  const [sunlightEnabled, setSunlightEnabled] = useState(true)

  const handleCountryClick = (country: CountryData) => {
    setSelectedCountry(country)
    setSidebarOpen(true)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
    setSelectedCountry(null) // Clear the selected country when closing the sidebar
  }

  const toggleRotation = () => {
    setRotationEnabled(!rotationEnabled)
  }

  const toggleSunlight = () => {
    setSunlightEnabled(!sunlightEnabled)
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas className="h-full w-full">
        {/* Space background */}
        <SpaceBackground />

        {/* Ambient light for overall illumination - always on */}
        <ambientLight intensity={sunlightEnabled ? 0.4 : 0.8} />

        {/* Directional light to simulate sunlight - only when sunlight is enabled */}
        {sunlightEnabled && <directionalLight position={[1, 0, 0]} intensity={1} />}

        {/* Earth with countries */}
        <Earth
          countries={countries}
          onCountryClick={handleCountryClick}
          selectedCountry={selectedCountry}
          rotationEnabled={rotationEnabled}
          sunlightEnabled={sunlightEnabled}
        />

        {/* Add some stars for extra effect */}
        <Stars radius={500} depth={20} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Controls for rotating and zooming */}
        <OrbitControls
          enablePan={false}
          minDistance={150}
          maxDistance={1000} // Increased but still less than background sphere radius
          rotateSpeed={0.5}
          zoomSpeed={0.5}
          makeDefault
        />
      </Canvas>

      {/* Control panel for toggles */}
      <ControlPanel
        rotationEnabled={rotationEnabled}
        sunlightEnabled={sunlightEnabled}
        onToggleRotation={toggleRotation}
        onToggleSunlight={toggleSunlight}
      />

      <CountrySidebar country={selectedCountry} onClose={closeSidebar} isOpen={sidebarOpen} />
    </div>
  )
}
