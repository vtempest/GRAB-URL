/**
 * @module defaults
 * Default configuration values shared by the React and Svelte
 * QuantumOrbital components, so both implementations stay in sync.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import type { OrbitalSphereConfig } from "../types/QuantumOrbital"

/** Default {@link OrbitalSphereConfig} used when no `config` prop is supplied. */
export const DEFAULT_ORBITAL_SPHERE_CONFIG: OrbitalSphereConfig = {
  minLines: 6,
  maxLines: 12,
  minSphereSize: 120,
  maxSphereSize: 180,
  minLineWidth: 0.8,
  maxLineWidth: 1.6,
  minGlowIntensity: 6,
  maxGlowIntensity: 12,
  minRotationSpeed: 2,
  maxRotationSpeed: 15,
  minSaturation: 70,
  maxSaturation: 90,
  minLightness: 50,
  maxLightness: 70,
  autoRandomizeMin: 5000,
  autoRandomizeMax: 12000,
  opacity: 0.75,
}
