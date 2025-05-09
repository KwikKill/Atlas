"use client"
import { Pause, Play, Sun, SunIcon as SunOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ControlPanelProps {
  rotationEnabled: boolean
  sunlightEnabled: boolean
  onToggleRotation: () => void
  onToggleSunlight: () => void
}

export default function ControlPanel({
  rotationEnabled,
  sunlightEnabled,
  onToggleRotation,
  onToggleSunlight,
}: ControlPanelProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 rounded-lg bg-black/30 p-3 backdrop-blur-sm">
      <button
        onClick={onToggleRotation}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors",
          rotationEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700",
        )}
        title={rotationEnabled ? "Disable Rotation" : "Enable Rotation"}
      >
        {rotationEnabled ? (
          <>
            <Pause className="h-4 w-4" /> Rotation
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Rotation
          </>
        )}
      </button>

      <button
        onClick={onToggleSunlight}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors",
          sunlightEnabled ? "bg-amber-600 hover:bg-amber-700" : "bg-gray-600 hover:bg-gray-700",
        )}
        title={sunlightEnabled ? "Disable Sunlight" : "Enable Sunlight"}
      >
        {sunlightEnabled ? (
          <>
            <Sun className="h-4 w-4" /> Sunlight
          </>
        ) : (
          <>
            <SunOff className="h-4 w-4" /> Sunlight
          </>
        )}
      </button>
    </div>
  )
}
