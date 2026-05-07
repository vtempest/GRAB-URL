"use client"

import { useState } from "react"
import QuantumOrbital from "@/components/QuantumOrbital"
import type { ColorScheme } from "@/types/QuantumOrbital.d"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Menu, X } from "lucide-react"

const COLOR_SCHEMES: ColorScheme[] = [
  "Single",
  "Dual",
  "Rainbow",
  "Random",
  "Complementary",
  "Triadic",
  "Analogous",
  "Split",
  "Tetradic",
  "Monochromatic",
  "Warm",
  "Cool",
  "Neon",
  "Sunset",
  "Ocean",
  "Forest",
  "Galaxy",
  "Fire",
  "Ice",
  "Cyberpunk",
  "Pastel",
  "Vintage",
  "Gradient",
  "Electric",
]

const BACKGROUND_COLORS = [
  { name: "Dark", value: "bg-gray-950" },
  { name: "Black", value: "bg-black" },
  { name: "Slate", value: "bg-slate-900" },
  { name: "Navy", value: "bg-blue-950" },
  { name: "Purple", value: "bg-purple-950" },
  { name: "Gray", value: "bg-gray-800" },
  { name: "White", value: "bg-white" },
  { name: "Light Gray", value: "bg-gray-100" },
]

export default function Home() {
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme | null>(null)
  const [sphereCount, setSphereCount] = useState(1)
  const [minLines, setMinLines] = useState(6)
  const [maxLines, setMaxLines] = useState(12)
  const [sphereSize, setSphereSize] = useState(150)
  const [rotationSpeed, setRotationSpeed] = useState(8)
  const [glowIntensity, setGlowIntensity] = useState(9)
  const [opacity, setOpacity] = useState(0.75)
  const [key, setKey] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(true)
  const [backgroundColor, setBackgroundColor] = useState("bg-gray-950")

  const handleSchemeSelect = (scheme: string) => {
    const colorScheme = scheme === "auto" ? null : (scheme as ColorScheme)
    setSelectedScheme(colorScheme)
    setKey((prev) => prev + 1)
  }

  const config = {
    minLines,
    maxLines,
    minSphereSize: sphereSize - 30,
    maxSphereSize: sphereSize + 30,
    minLineWidth: 0.8,
    maxLineWidth: 1.6,
    minGlowIntensity: glowIntensity - 3,
    maxGlowIntensity: glowIntensity + 3,
    minRotationSpeed: rotationSpeed - 5,
    maxRotationSpeed: rotationSpeed + 5,
    minSaturation: 70,
    maxSaturation: 90,
    minLightness: 50,
    maxLightness: 70,
    autoRandomizeMin: 5000,
    autoRandomizeMax: 12000,
    opacity,
  }

  return (
    <main className={`flex min-h-screen ${backgroundColor}`}>
      <div className="flex w-full">
        {/* Left Column - Spheres */}
        <div className="flex flex-1 items-start justify-center p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: sphereCount }).map((_, index) => (
              <QuantumOrbital
                key={`${key}-${index}`}
                config={config}
                autoRandomize={!selectedScheme}
                onSphereClick={() => setKey((prev) => prev + 1)}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="flex w-[380px] shrink-0 items-start p-8">
          {isSettingsOpen ? (
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Configure orbital properties</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close settings</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color Scheme Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="color-scheme">Color Scheme</Label>
                  <Select value={selectedScheme || "auto"} onValueChange={handleSchemeSelect}>
                    <SelectTrigger id="color-scheme">
                      <SelectValue placeholder="Auto-randomize" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-randomize</SelectItem>
                      {COLOR_SCHEMES.map((scheme) => (
                        <SelectItem key={scheme} value={scheme}>
                          {scheme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Background Color</Label>
                  <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                    <SelectTrigger id="background-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUND_COLORS.map((bg) => (
                        <SelectItem key={bg.value} value={bg.value}>
                          {bg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sphere Count */}
                <div className="space-y-2">
                  <Label htmlFor="sphere-count">Spheres: {sphereCount}</Label>
                  <Slider
                    id="sphere-count"
                    min={1}
                    max={10}
                    step={1}
                    value={[sphereCount]}
                    onValueChange={(value) => setSphereCount(value[0])}
                  />
                </div>

                {/* Lines */}
                <div className="space-y-2">
                  <Label>
                    Lines: {minLines}-{maxLines}
                  </Label>
                  <div className="space-y-1">
                    <Slider
                      min={3}
                      max={15}
                      step={1}
                      value={[minLines]}
                      onValueChange={(value) => setMinLines(value[0])}
                    />
                    <Slider
                      min={3}
                      max={20}
                      step={1}
                      value={[maxLines]}
                      onValueChange={(value) => setMaxLines(value[0])}
                    />
                  </div>
                </div>

                {/* Sphere Size */}
                <div className="space-y-2">
                  <Label htmlFor="sphere-size">Size: {sphereSize}px</Label>
                  <Slider
                    id="sphere-size"
                    min={80}
                    max={250}
                    step={10}
                    value={[sphereSize]}
                    onValueChange={(value) => setSphereSize(value[0])}
                  />
                </div>

                {/* Rotation Speed */}
                <div className="space-y-2">
                  <Label htmlFor="rotation-speed">Rotation Speed: {rotationSpeed}s</Label>
                  <Slider
                    id="rotation-speed"
                    min={2}
                    max={20}
                    step={1}
                    value={[rotationSpeed]}
                    onValueChange={(value) => setRotationSpeed(value[0])}
                  />
                </div>

                {/* Glow Intensity */}
                <div className="space-y-2">
                  <Label htmlFor="glow-intensity">Glow: {glowIntensity}px</Label>
                  <Slider
                    id="glow-intensity"
                    min={3}
                    max={20}
                    step={1}
                    value={[glowIntensity]}
                    onValueChange={(value) => setGlowIntensity(value[0])}
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <Label htmlFor="opacity">Opacity: {opacity.toFixed(2)}</Label>
                  <Slider
                    id="opacity"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={[opacity]}
                    onValueChange={(value) => setOpacity(value[0])}
                  />
                </div>

                <Button variant="secondary" className="w-full" onClick={() => setKey((prev) => prev + 1)}>
                  Regenerate
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open settings</span>
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
