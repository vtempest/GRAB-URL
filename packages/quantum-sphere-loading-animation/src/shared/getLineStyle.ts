/**
 * @module getLineStyle
 * Pure helper that resolves the inline style for a single orbital line by
 * blending the sphere's base appearance, the global hue shift, and any
 * active hover effects into a final HSLA color, transform, glow, and
 * animation duration.
 *
 * Shared between the React and Svelte components so both produce identical
 * visuals from the same inputs.
 *
 * @author [vtempest](https://github.com/vtempest)
 */
import type { HoverEffects, LineStyle, OrbitalLine, SphereData } from "../types/QuantumOrbital"

/**
 * Compute the inline style for an orbital line.
 *
 * @param line - The orbital line to style.
 * @param sphereData - The owning sphere's resolved configuration.
 * @param hueShift - Global hue rotation applied across all lines.
 * @param hoveredLineId - Currently hovered line id, or null.
 * @param hoverEffects - Random hover-overlay effects (only read when this line is hovered).
 * @param opacity - Base alpha applied to the HSLA color.
 * @returns CSS style values ready to apply to the line element.
 */
export function getLineStyle(
  line: OrbitalLine,
  sphereData: SphereData,
  hueShift: number,
  hoveredLineId: number | null,
  hoverEffects: HoverEffects,
  opacity: number,
): LineStyle {
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

  const color = `hsla(${finalHue}, ${finalSaturation}%, ${finalLightness}%, ${opacity})`

  return {
    transform: `rotateX(${line.angleX}deg) rotateY(${line.angleY}deg) rotateZ(${line.angleZ}deg) scale(${finalScale})`,
    borderColor: color,
    borderWidth: `${sphereData.lineWidth}px`,
    boxShadow: `0 0 ${finalGlow}px ${color}`,
    animationDuration: `${finalSpeed}s`,
    zIndex: isHovered ? 10 : 1,
  }
}
