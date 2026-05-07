"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import type {
  HoverEffects,
  LineStyle,
  OrbitalLine,
  OrbitalSphereProps,
  SphereData,
} from "../types/QuantumOrbital"
import { useRandom } from "./useRandom"
import { useSphereConfig } from "./useSphereConfig"

import "./QuantumOrbital.css"

/**
 * Parabolic spherical orbital, inspired by quantum superposition of atomic orbitals and the
 * [wave function collapse](https://en.wikipedia.org/wiki/Wave_function_collapse).
 * Quantum superposition principle allows particles to occupy multiple quantum states
 * simultaneously until measured: in this case, hovering over with mouse changes electron orbit.
 * @author [vtempest](https://github.com/vtempest)
 */
export default function QuantumOrbital({
  config = {
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
  },
  autoRandomize = true,
  className = "",
  onSphereClick = null,
}: OrbitalSphereProps) {
  const rng = useRandom()
  const { randomRange } = rng
  const generateSphereConfig = useSphereConfig(config, rng)

  const [sphereData, setSphereData] = useState<SphereData>(() => generateSphereConfig(config))
  const [hueShift, setHueShift] = useState<number>(0)
  const [hoveredLineId, setHoveredLineId] = useState<number | null>(null)
  const [hoverEffects, setHoverEffects] = useState<HoverEffects>({} as HoverEffects)
  const sphereRef = useRef<HTMLDivElement>(null)
  const timeoutIdRef = useRef<number | null>(null)
  const hueTimeoutIdRef = useRef<number | null>(null)

  /**
   * Document-level pointer tracker. Determines whether the cursor is currently
   * over the sphere and, if so, which orbital line element is under it (via
   * `data-line-id`). Picks a fresh batch of {@link HoverEffects} on hover
   * transitions so the highlighted line gets a unique flair each time.
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent): void => {
      if (!sphereRef.current) return

      const sphereRect = sphereRef.current.getBoundingClientRect()
      const isOverSphere =
        event.clientX >= sphereRect.left &&
        event.clientX <= sphereRect.right &&
        event.clientY >= sphereRect.top &&
        event.clientY <= sphereRect.bottom

      if (!isOverSphere) {
        setHoveredLineId(null)
        return
      }

      const elementFromPoint = document.elementFromPoint(event.clientX, event.clientY)
      if (elementFromPoint && (elementFromPoint as HTMLElement).dataset.lineId) {
        const lineId = Number.parseInt((elementFromPoint as HTMLElement).dataset.lineId!)
        if (lineId !== hoveredLineId) {
          setHoveredLineId(lineId)
          setHoverEffects({
            hueShift: randomRange(-90, 90),
            saturationBoost: randomRange(10, 30),
            lightnessShift: randomRange(-20, 20),
            glowMultiplier: randomRange(1.5, 3),
            speedMultiplier: randomRange(0.3, 2.5),
            scaleMultiplier: randomRange(1.1, 1.4),
          })
        }
      } else {
        setHoveredLineId(null)
      }
    },
    [hoveredLineId, randomRange],
  )

  /**
   * Forwards a click on the sphere container to the user-supplied
   * `onSphereClick` callback (no-op when none is provided).
   */
  const handleSphereClick = useCallback(
    (_event: React.MouseEvent<HTMLDivElement>): void => {
      if (onSphereClick) {
        onSphereClick()
      }
    },
    [onSphereClick],
  )

  /**
   * Compute the inline style for a single orbital line, blending the sphere's
   * base appearance, the global hue shift, and any active hover effects into a
   * final HSLA color, transform, glow, and animation duration.
   */
  const getLineStyle = useCallback(
    (line: OrbitalLine): LineStyle => {
      const isHovered = hoveredLineId === line.id
      let finalHue = (line.hue + hueShift) % 360
      let finalSaturation = sphereData.saturation
      let finalLightness = line.customLightness || sphereData.lightness
      let finalGlow = sphereData.glowIntensity
      let finalSpeed = sphereData.rotationSpeed * line.speed
      let finalScale = 1

      if (isHovered) {
        finalHue = (finalHue + hoverEffects.hueShift) % 360
        finalSaturation = Math.min(100, finalSaturation + hoverEffects.saturationBoost)
        finalLightness = Math.max(0, Math.min(100, finalLightness + hoverEffects.lightnessShift))
        finalGlow *= hoverEffects.glowMultiplier
        finalSpeed *= hoverEffects.speedMultiplier
        finalScale = hoverEffects.scaleMultiplier
      }

      const color = `hsla(${finalHue}, ${finalSaturation}%, ${finalLightness}%, ${config.opacity})`

      return {
        transform: `rotateX(${line.angleX}deg) rotateY(${line.angleY}deg) rotateZ(${line.angleZ}deg) scale(${finalScale})`,
        borderColor: color,
        borderWidth: `${sphereData.lineWidth}px`,
        boxShadow: `0 0 ${finalGlow}px ${color}`,
        animationDuration: `${finalSpeed}s`,
        zIndex: isHovered ? 10 : 1,
      }
    },
    [hoveredLineId, hueShift, sphereData, hoverEffects, config.opacity],
  )

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  useEffect(() => {
    if (!autoRandomize) return

    const scheduleNext = () => {
      setSphereData(generateSphereConfig(config))
      const delay = randomRange(config.autoRandomizeMin, config.autoRandomizeMax)
      timeoutIdRef.current = window.setTimeout(scheduleNext, delay)
    }

    const scheduleHueShift = () => {
      setHueShift((prev) => (prev + randomRange(10, 50)) % 360)
      const delay = randomRange(2000, 6000)
      hueTimeoutIdRef.current = window.setTimeout(scheduleHueShift, delay)
    }

    scheduleNext()
    scheduleHueShift()

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
      if (hueTimeoutIdRef.current) clearTimeout(hueTimeoutIdRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRandomize])

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      <div className="relative z-10" onClick={handleSphereClick} ref={sphereRef}>
        <div
          className="relative cursor-pointer orbital-sphere"
          style={{
            transformStyle: "preserve-3d",
            animation: `orbitalSpin ${sphereData.rotationSpeed}s infinite linear`,
            width: `${sphereData.sphereSize}px`,
            height: `${sphereData.sphereSize}px`,
          }}
        >
          {sphereData.lines.map((line) => {
            const lineStyle = getLineStyle(line)
            return (
              <div
                key={line.id}
                className="absolute inset-0 rounded-full border-solid transition-all duration-200 ease-in-out orbital-line"
                data-line-id={line.id}
                style={{
                  transform: lineStyle.transform,
                  borderColor: lineStyle.borderColor,
                  borderWidth: lineStyle.borderWidth,
                  boxShadow: lineStyle.boxShadow,
                  animationDuration: lineStyle.animationDuration,
                  zIndex: lineStyle.zIndex,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
