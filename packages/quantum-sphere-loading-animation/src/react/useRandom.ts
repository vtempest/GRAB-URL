/**
 * @module useRandom
 * Seeded pseudo-random number generator hook used by QuantumOrbital.
 *
 * Backed by a Park–Miller (Lehmer) linear congruential generator so that the
 * sequence is deterministic for a given seed but cheap and dependency-free.
 * The seed is initialized once per component mount from `Date.now()` so each
 * sphere gets its own reproducible-within-render random stream.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import { useCallback, useRef } from "react"
import type { RandomFunction, RandomIntFunction, RandomRangeFunction } from "../types/QuantumOrbital"

/**
 * Bundle of seeded random helpers returned by {@link useRandom}.
 */
export interface RandomUtils {
  /** Returns a float in [0, 1). */
  random: RandomFunction
  /** Returns a float in [min, max). */
  randomRange: RandomRangeFunction
  /** Returns an integer in [min, max] (both inclusive). */
  randomInt: RandomIntFunction
}

/**
 * React hook providing a stable, seeded RNG for the lifetime of the component.
 *
 * Each helper is wrapped in `useCallback` so referential equality is preserved
 * across renders, making the helpers safe to use in dependency arrays without
 * causing unwanted re-runs.
 *
 * @returns {@link RandomUtils} bag of `random`, `randomRange`, `randomInt`.
 */
export function useRandom(): RandomUtils {
  const seedRef = useRef<number>(Date.now() % 2147483647)

  const random = useCallback<RandomFunction>(() => {
    seedRef.current = (seedRef.current * 16807) % 2147483647
    return (seedRef.current - 1) / 2147483646
  }, [])

  const randomRange = useCallback<RandomRangeFunction>(
    (min, max) => min + random() * (max - min),
    [random],
  )

  const randomInt = useCallback<RandomIntFunction>(
    (min, max) => Math.floor(randomRange(min, max + 1)),
    [randomRange],
  )

  return { random, randomRange, randomInt }
}
