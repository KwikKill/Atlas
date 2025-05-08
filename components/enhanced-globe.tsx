"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useTexture, Stars } from "@react-three/drei"
import * as THREE from "three"
import CountrySidebar from "./country-sidebar"
import type { CountryData } from "@/lib/types"

// Space background component using a much larger sphere
function SpaceBackground() {
  const { scene } = useThree()

  useEffect(() => {
    // Load the space texture
    /*const textureLoader = new THREE.TextureLoader()
    textureLoader.load("/space.png", (texture) => {
      // Create a large sphere with the texture on the inside
      const geometry = new THREE.SphereGeometry(200, 32, 32)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide, // Render the inside of the sphere
      })
      const spaceSphere = new THREE.Mesh(geometry, material)
      scene.add(spaceSphere)
    })*/

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

// Multi-layered Earth component
function Earth({
  countries,
  onCountryClick,
}: {
  countries: CountryData[]
  onCountryClick: (country: CountryData) => void
}) {
  const earthGroupRef = useRef<THREE.Group>(null)
  const earthMeshRef = useRef<THREE.Mesh>(null)
  const cloudsMeshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const [hovered, setHovered] = useState<string | null>(null)
  const [visibleCountries, setVisibleCountries] = useState<Set<string>>(new Set())

  // Country marker refs to track positions
  const countryRefs = useRef<{ [key: string]: THREE.Mesh | null }>({})

  // Load earth textures - 
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
    Object.entries(countryRefs.current).forEach(([countryId, meshRef]) => {
      if (meshRef) {
        const countryPosition = new THREE.Vector3()
        meshRef.getWorldPosition(countryPosition)

        // Direction from globe center to country
        const countryDirection = countryPosition.clone().normalize()

        // Dot product determines if country is on visible side
        // If dot product > 0, the country is on the same side as the camera
        const dotProduct = countryDirection.dot(cameraDirection)

        if (dotProduct > 0) {
          newVisibleCountries.add(countryId)
        }
      }
    })

    setVisibleCountries(newVisibleCountries)
  }

  // Rotation animation
  useFrame(() => {
    if (earthGroupRef.current) {
      // Rotate the entire earth group (including country markers)
      earthGroupRef.current.rotation.y += 0.0005

      // Rotate clouds slightly faster for a dynamic effect
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.0001
      }

      updateVisibleCountries()
    }
  })

  return (
    // Use a group to contain both the Earth and country markers so they rotate together
    <group ref={earthGroupRef}>
      {/* Earth sphere with multi-layered textures */}
      <mesh ref={earthMeshRef}>
        <sphereGeometry args={[100, 64, 64]} />
        <meshPhysicalMaterial map={albedoMap} bumpMap={bumpMap} bumpScale={1} roughness={1} metalness={0.1} metalnessMap={oceanMap}/>
      </mesh>

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

        const position = latLongToVector3(country.latlng[0], country.latlng[1], 101)
        const isHovered = hovered === country.cca3
        const isVisible = visibleCountries.has(country.cca3)

        return (
          <mesh
            key={country.cca3}
            ref={(el) => (countryRefs.current[country.cca3] = el)}
            position={position}
            onClick={(e) => {
              if (!isVisible) return
              e.stopPropagation()
              onCountryClick(country)
            }}
            onPointerOver={(e) => {
              if (!isVisible) return
              e.stopPropagation()
              setHovered(country.cca3)
              document.body.style.cursor = "pointer"
            }}
            onPointerOut={(e) => {
              if (!isVisible) return
              e.stopPropagation()
              setHovered(null)
              document.body.style.cursor = "auto"
            }}
          >
            <sphereGeometry args={[isHovered && isVisible ? 2 : 1.5, 16, 16]} />
            <meshBasicMaterial
              color={isHovered && isVisible ? "#ff9900" : "#ffcc00"}
              opacity={isVisible ? 1 : 0.3}
              transparent={true}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export default function EnhancedGlobe({ countries }: { countries: CountryData[] }) {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCountryClick = (country: CountryData) => {
    setSelectedCountry(country)
    setSidebarOpen(true)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas className="h-full w-full">
        {/* Space background */}
        <SpaceBackground />

        {/* Ambient light for overall illumination */}
        <ambientLight intensity={0.4} />

        {/* Directional light to simulate sunlight */}
        <directionalLight position={[1, 0, 0]} intensity={1} />

        {/* Earth with countries */}
        <Earth countries={countries} onCountryClick={handleCountryClick} />

        {/* Add some stars for extra effect */}
        <Stars radius={500} depth={20} count={50000} factor={4} saturation={0} fade speed={1} />

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

      <CountrySidebar country={selectedCountry} onClose={closeSidebar} isOpen={sidebarOpen} />
    </div>
  )
}
