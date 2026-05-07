/**
 * @module colorSchemes
 * Color scheme palette definitions shared by the React and Svelte
 * QuantumOrbital implementations.
 *
 * Each scheme is a function mapping an orbital line index to an HSL hue,
 * letting the same generator emit many distinct visual styles (Triadic,
 * Neon, Galaxy, etc.) from one base hue. Stochastic schemes draw from the
 * injected `random` / `randomRange` helpers so the component's seeded RNG
 * remains the single source of randomness.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import type { ColorScheme, RandomFunction, RandomRangeFunction } from "../types/QuantumOrbital"

/**
 * Function signature for a color scheme.
 *
 * @param index - Index of the orbital line being colored (0-based).
 * @param total - Total number of orbital lines in the sphere.
 * @param baseHue - Base HSL hue (0-360) shared by all lines for the current sphere.
 * @returns Hue value (0-360) to assign to this line.
 */
export type ColorSchemeFunction = (index: number, total: number, baseHue: number) => number

/** Map of every available {@link ColorScheme} name to its hue-resolution function. */
export type ColorSchemeMap = Record<ColorScheme, ColorSchemeFunction>

/**
 * Build the full set of color scheme functions, bound to the supplied seeded RNG.
 *
 * @param random - Seeded random helper returning a value in [0, 1).
 * @param randomRange - Seeded helper returning a float in [min, max).
 * @returns Map of color scheme name to hue function.
 */
export function createColorSchemes(
  random: RandomFunction,
  randomRange: RandomRangeFunction,
): ColorSchemeMap {
  return {
    /** Single hue — every line shares the base hue. */
    Single: (_index, _total, baseHue) => baseHue,
    /** Two alternating hues 180° apart. */
    Dual: (index, _total, baseHue) => (index % 2 === 0 ? baseHue : (baseHue + 180) % 360),
    /** Complementary pair — alternates base hue and its 180° complement. */
    Complementary: (index, _total, baseHue) =>
      index % 2 === 0 ? baseHue : (baseHue + 180) % 360,
    /** Three hues evenly spaced 120° apart. */
    Triadic: (index, _total, baseHue) => baseHue + (index % 3) * 120,
    /** Adjacent hues stepping 30° around the wheel. */
    Analogous: (index, _total, baseHue) => (baseHue + index * 30) % 360,
    /** Split-complementary — base hue plus two near its complement. */
    Split: (index, _total, baseHue) => {
      const angles = [0, 150, 210]
      return (baseHue + angles[index % 3]) % 360
    },
    /** Four hues evenly spaced 90° apart. */
    Tetradic: (index, _total, baseHue) => baseHue + (index % 4) * 90,
    /** Single hue — used with varied lightness for monochrome shading. */
    Monochromatic: (_index, _total, baseHue) => baseHue,
    /** Warm reds, oranges, yellows. */
    Warm: (index) => randomRange(0, 60) + (index % 2) * 300,
    /** Cool blues, greens, purples. */
    Cool: () => randomRange(180, 270),
    /** Vivid neon palette cycled through magenta, lime, cyan etc. */
    Neon: (index) => {
      const neonHues = [300, 60, 120, 180, 240, 0]
      return neonHues[index % neonHues.length]
    },
    /** Sunset oranges, reds, pinks. */
    Sunset: (index) => {
      const sunsetHues = [15, 30, 45, 330, 345]
      return sunsetHues[index % sunsetHues.length]
    },
    /** Ocean blues and teals. */
    Ocean: (index) => {
      const oceanHues = [180, 200, 220, 240, 160]
      return oceanHues[index % oceanHues.length]
    },
    /** Forest greens. */
    Forest: (index) => {
      const forestHues = [120, 140, 90, 100, 80]
      return forestHues[index % forestHues.length]
    },
    /** Galaxy purples and deep blues. */
    Galaxy: (index) => {
      const galaxyHues = [240, 280, 300, 260, 220]
      return galaxyHues[index % galaxyHues.length]
    },
    /** Fire reds, oranges, yellows. */
    Fire: (index) => {
      const fireHues = [0, 15, 30, 45, 60]
      return fireHues[index % fireHues.length]
    },
    /** Ice — light blues and cyans. */
    Ice: (index) => {
      const iceHues = [180, 190, 200, 210, 220]
      return iceHues[index % iceHues.length]
    },
    /** Cyberpunk magentas, cyans, limes. */
    Cyberpunk: (index) => {
      const cyberpunkHues = [300, 180, 60, 320, 200]
      return cyberpunkHues[index % cyberpunkHues.length]
    },
    /** Random hues — paired with reduced saturation for soft pastels. */
    Pastel: () => random() * 360,
    /** Vintage warm browns and muted blues. */
    Vintage: (index) => {
      const vintageHues = [30, 45, 60, 200, 220]
      return vintageHues[index % vintageHues.length]
    },
    /** Smooth gradient sweeping 60° starting from the base hue. */
    Gradient: (index, total, baseHue) => (baseHue + (index / total) * 60) % 360,
    /** Bright saturated electric colors. */
    Electric: (index) => {
      const electricHues = [60, 120, 180, 240, 300]
      return electricHues[index % electricHues.length]
    },
    /** Full rainbow — evenly distributes hues across all lines. */
    Rainbow: (index, total) => (index / total) * 360,
    /** Pure random hue per line. */
    Random: () => random() * 360,
  }
}
