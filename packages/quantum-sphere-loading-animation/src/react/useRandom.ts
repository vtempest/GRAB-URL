/**
 * @module useRandom
 * React hook wrapper around the shared seeded RNG.
 *
 * Wraps {@link createRandom} in `useRef` so the same RNG instance survives
 * across renders, and exposes its helpers via `useCallback` for stable
 * referential equality in dependency arrays.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import { useCallback, useRef } from "react"
import type { RandomFunction, RandomIntFunction, RandomRangeFunction } from "../types/QuantumOrbital"
import { createRandom, type RandomUtils } from "../shared/random"

export type { RandomUtils } from "../shared/random"

/**
 * React hook providing a stable, seeded RNG for the lifetime of the component.
 *
 * @returns {@link RandomUtils} bag of `random`, `randomRange`, `randomInt`.
 */
export function useRandom(): RandomUtils {
  const rngRef = useRef<RandomUtils | null>(null)
  if (!rngRef.current) {
    rngRef.current = createRandom()
  }

  const random = useCallback<RandomFunction>(() => rngRef.current!.random(), [])
  const randomRange = useCallback<RandomRangeFunction>(
    (min, max) => rngRef.current!.randomRange(min, max),
    [],
  )
  const randomInt = useCallback<RandomIntFunction>(
    (min, max) => rngRef.current!.randomInt(min, max),
    [],
  )

  return { random, randomRange, randomInt }
}
