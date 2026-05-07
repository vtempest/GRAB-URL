/**
 * @module generateSphereConfig
 * Pure (framework-agnostic) generator for QuantumOrbital sphere data.
 *
 * Picks a random color scheme on each invocation, applies scheme-specific
 * tweaks to saturation/lightness (e.g. softer values for `Pastel`, max
 * saturation for `Neon`/`Electric`), and emits a per-line list with random
 * 3D orientation and rotation speed.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import type {
  ColorScheme,
  OrbitalLine,
  OrbitalSphereConfig,
  SphereData,
} from "../types/QuantumOrbital"
import { createColorSchemes, type ColorSchemeMap } from "./colorSchemes"
import type { RandomUtils } from "./random"

/**
 * Build a fully-resolved {@link SphereData} from the supplied config and RNG.
 *
 * Optionally accepts a precomputed {@link ColorSchemeMap}; if omitted, one is
 * built from the supplied RNG. Reusing a map avoids reallocation when the
 * generator is called repeatedly (e.g. on the React render path).
 *
 * @param cfg - Sphere configuration (ranges/min-max bounds).
 * @param rng - Seeded RNG bundle from {@link createRandom}.
 * @param colorSchemes - Optional precomputed color scheme map.
 * @returns Newly randomized {@link SphereData}.
 */
export function generateSphereConfig(
  cfg: OrbitalSphereConfig,
  rng: RandomUtils,
  colorSchemes: ColorSchemeMap = createColorSchemes(rng.random, rng.randomRange),
): SphereData {
  const { random, randomRange, randomInt } = rng
  const colorSchemeNames = Object.keys(colorSchemes) as ColorScheme[]

  const lineCount = randomInt(cfg.minLines, cfg.maxLines)
  const sphereSize = randomInt(cfg.minSphereSize, cfg.maxSphereSize)
  const lineWidth = randomRange(cfg.minLineWidth, cfg.maxLineWidth)
  const glowIntensity = randomRange(cfg.minGlowIntensity, cfg.maxGlowIntensity)
  const rotationSpeed = randomRange(cfg.minRotationSpeed, cfg.maxRotationSpeed)

  const colorSchemeName = colorSchemeNames[randomInt(0, colorSchemeNames.length - 1)]
  const colorSchemeFunc = colorSchemes[colorSchemeName]

  let saturation = randomInt(cfg.minSaturation, cfg.maxSaturation)
  let lightness = randomInt(cfg.minLightness, cfg.maxLightness)

  if (colorSchemeName === "Pastel") {
    saturation = randomInt(30, 50)
    lightness = randomInt(70, 85)
  } else if (colorSchemeName === "Neon" || colorSchemeName === "Electric") {
    saturation = randomInt(85, 100)
    lightness = randomInt(50, 70)
  } else if (colorSchemeName === "Vintage") {
    saturation = randomInt(40, 60)
    lightness = randomInt(40, 60)
  } else if (colorSchemeName === "Monochromatic") {
    lightness = randomInt(30, 80)
  }

  const baseHue = random() * 360

  const lines: OrbitalLine[] = []
  for (let i = 0; i < lineCount; i++) {
    const hue = colorSchemeFunc(i, lineCount, baseHue)

    let lineLightness = lightness
    if (colorSchemeName === "Monochromatic") {
      lineLightness = randomInt(30, 80)
    }

    lines.push({
      id: i,
      angleX: random() * 360,
      angleY: random() * 360,
      angleZ: random() * 360,
      hue,
      speed: randomRange(0.5, 1.5),
      customLightness: colorSchemeName === "Monochromatic" ? lineLightness : undefined,
    })
  }

  return {
    lines,
    sphereSize,
    lineWidth,
    glowIntensity,
    rotationSpeed,
    saturation,
    lightness,
    colorScheme: colorSchemeName,
  }
}
