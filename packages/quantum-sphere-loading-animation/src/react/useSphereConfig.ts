/**
 * @module useSphereConfig
 * Hook that produces a fully-resolved {@link SphereData} configuration each
 * time the orbital sphere needs to (re)randomize its appearance.
 *
 * The hook ties together the seeded {@link useRandom} helpers and the
 * {@link createColorSchemes} palette so that every generated sphere has
 * consistent, deterministic randomness derived from a single seed.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import { useCallback, useMemo } from "react"
import type {
  ColorScheme,
  OrbitalLine,
  OrbitalSphereConfig,
  SphereData,
} from "../types/QuantumOrbital"
import { createColorSchemes } from "./colorSchemes"
import type { RandomUtils } from "./useRandom"

/**
 * Function returned by {@link useSphereConfig} that builds a new
 * {@link SphereData} from the supplied (or default) {@link OrbitalSphereConfig}.
 */
export type GenerateSphereConfig = (cfg?: OrbitalSphereConfig) => SphereData

/**
 * React hook that returns a memoized sphere-config generator.
 *
 * Picks a random color scheme on each invocation, applies scheme-specific
 * tweaks to saturation/lightness (e.g. softer values for `Pastel`, max
 * saturation for `Neon`/`Electric`), and emits a per-line list with random
 * 3D orientation and rotation speed.
 *
 * @param config - Default {@link OrbitalSphereConfig} used when the returned
 *                 generator is invoked without an argument.
 * @param rng - Seeded RNG bundle from {@link useRandom}.
 * @returns Function that produces a freshly-randomized {@link SphereData}.
 */
export function useSphereConfig(
  config: OrbitalSphereConfig,
  rng: RandomUtils,
): GenerateSphereConfig {
  const { random, randomRange, randomInt } = rng

  const colorSchemes = useMemo(
    () => createColorSchemes(random, randomRange),
    [random, randomRange],
  )

  const colorSchemeNames = useMemo(
    () => Object.keys(colorSchemes) as ColorScheme[],
    [colorSchemes],
  )

  /**
   * Build a fresh {@link SphereData} from the supplied config (defaults to the
   * config captured by the hook).
   */
  const generateSphereConfig = useCallback<GenerateSphereConfig>(
    (cfg: OrbitalSphereConfig = config): SphereData => {
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
    },
    [config, randomInt, randomRange, random, colorSchemeNames, colorSchemes],
  )

  return generateSphereConfig
}
