/**
 * @module random
 * Framework-agnostic seeded pseudo-random number generator.
 *
 * Backed by a Park–Miller (Lehmer) linear congruential generator: cheap,
 * dependency-free, and deterministic for a given seed. Used by both the
 * React hook and the Svelte component so each instance gets a reproducible
 * stream.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import type { RandomFunction, RandomIntFunction, RandomRangeFunction } from "../types/QuantumOrbital"

/** Bundle of seeded random helpers returned by {@link createRandom}. */
export interface RandomUtils {
  /** Returns a float in [0, 1). */
  random: RandomFunction
  /** Returns a float in [min, max). */
  randomRange: RandomRangeFunction
  /** Returns an integer in [min, max] (both inclusive). */
  randomInt: RandomIntFunction
}

/**
 * Build a fresh seeded RNG. The seed defaults to `Date.now() % 2147483647` so
 * each call produces an independent stream while remaining reproducible if a
 * specific seed is provided.
 *
 * @param seedValue - Optional initial seed.
 * @returns {@link RandomUtils} bag of helpers.
 */
export function createRandom(seedValue: number = Date.now() % 2147483647): RandomUtils {
  let seed = seedValue

  const random: RandomFunction = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const randomRange: RandomRangeFunction = (min, max) => min + random() * (max - min)

  const randomInt: RandomIntFunction = (min, max) => Math.floor(randomRange(min, max + 1))

  return { random, randomRange, randomInt }
}
