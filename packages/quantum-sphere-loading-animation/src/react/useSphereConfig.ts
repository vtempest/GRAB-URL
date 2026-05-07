/**
 * @module useSphereConfig
 * React hook wrapping the shared {@link generateSphereConfig} so the orbital
 * sphere can (re)randomize its appearance on demand.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import { useCallback, useMemo } from "react"
import type { OrbitalSphereConfig, SphereData } from "../types/QuantumOrbital"
import { createColorSchemes } from "../shared/colorSchemes"
import { generateSphereConfig as generateSphereConfigImpl } from "../shared/generateSphereConfig"
import type { RandomUtils } from "../shared/random"

/** Function returned by {@link useSphereConfig} that builds a new {@link SphereData}. */
export type GenerateSphereConfig = (cfg?: OrbitalSphereConfig) => SphereData

/**
 * React hook that returns a memoized sphere-config generator.
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
  const colorSchemes = useMemo(
    () => createColorSchemes(rng.random, rng.randomRange),
    [rng.random, rng.randomRange],
  )

  return useCallback<GenerateSphereConfig>(
    (cfg: OrbitalSphereConfig = config) => generateSphereConfigImpl(cfg, rng, colorSchemes),
    [config, rng, colorSchemes],
  )
}
