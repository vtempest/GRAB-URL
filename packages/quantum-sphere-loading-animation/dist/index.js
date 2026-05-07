// src/react/QuantumOrbital.tsx
import { useCallback as useCallback3, useEffect, useRef as useRef2, useState } from "react";

// src/shared/defaults.ts
var DEFAULT_ORBITAL_SPHERE_CONFIG = {
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
  autoRandomizeMin: 5e3,
  autoRandomizeMax: 12e3,
  opacity: 0.75
};

// src/shared/getLineStyle.ts
function getLineStyle(line, sphereData, hueShift, hoveredLineId, hoverEffects, opacity) {
  const isHovered = hoveredLineId === line.id;
  let finalHue = (line.hue + hueShift) % 360;
  let finalSaturation = sphereData.saturation;
  let finalLightness = line.customLightness || sphereData.lightness;
  let finalGlow = sphereData.glowIntensity;
  let finalSpeed = sphereData.rotationSpeed * line.speed;
  let finalScale = 1;
  if (isHovered) {
    finalHue = (finalHue + hoverEffects.hueShift) % 360;
    finalSaturation = Math.min(100, finalSaturation + hoverEffects.saturationBoost);
    finalLightness = Math.max(0, Math.min(100, finalLightness + hoverEffects.lightnessShift));
    finalGlow *= hoverEffects.glowMultiplier;
    finalSpeed *= hoverEffects.speedMultiplier;
    finalScale = hoverEffects.scaleMultiplier;
  }
  const color = `hsla(${finalHue}, ${finalSaturation}%, ${finalLightness}%, ${opacity})`;
  return {
    transform: `rotateX(${line.angleX}deg) rotateY(${line.angleY}deg) rotateZ(${line.angleZ}deg) scale(${finalScale})`,
    borderColor: color,
    borderWidth: `${sphereData.lineWidth}px`,
    boxShadow: `0 0 ${finalGlow}px ${color}`,
    animationDuration: `${finalSpeed}s`,
    zIndex: isHovered ? 10 : 1
  };
}

// src/react/useRandom.ts
import { useCallback, useRef } from "react";

// src/shared/random.ts
function createRandom(seedValue = Date.now() % 2147483647) {
  let seed = seedValue;
  const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const randomRange = (min, max) => min + random() * (max - min);
  const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));
  return { random, randomRange, randomInt };
}

// src/react/useRandom.ts
function useRandom() {
  const rngRef = useRef(null);
  if (!rngRef.current) {
    rngRef.current = createRandom();
  }
  const random = useCallback(() => rngRef.current.random(), []);
  const randomRange = useCallback(
    (min, max) => rngRef.current.randomRange(min, max),
    []
  );
  const randomInt = useCallback(
    (min, max) => rngRef.current.randomInt(min, max),
    []
  );
  return { random, randomRange, randomInt };
}

// src/react/useSphereConfig.ts
import { useCallback as useCallback2, useMemo } from "react";

// src/shared/colorSchemes.ts
function createColorSchemes(random, randomRange) {
  return {
    /** Single hue — every line shares the base hue. */
    Single: (_index, _total, baseHue) => baseHue,
    /** Two alternating hues 180° apart. */
    Dual: (index, _total, baseHue) => index % 2 === 0 ? baseHue : (baseHue + 180) % 360,
    /** Complementary pair — alternates base hue and its 180° complement. */
    Complementary: (index, _total, baseHue) => index % 2 === 0 ? baseHue : (baseHue + 180) % 360,
    /** Three hues evenly spaced 120° apart. */
    Triadic: (index, _total, baseHue) => baseHue + index % 3 * 120,
    /** Adjacent hues stepping 30° around the wheel. */
    Analogous: (index, _total, baseHue) => (baseHue + index * 30) % 360,
    /** Split-complementary — base hue plus two near its complement. */
    Split: (index, _total, baseHue) => {
      const angles = [0, 150, 210];
      return (baseHue + angles[index % 3]) % 360;
    },
    /** Four hues evenly spaced 90° apart. */
    Tetradic: (index, _total, baseHue) => baseHue + index % 4 * 90,
    /** Single hue — used with varied lightness for monochrome shading. */
    Monochromatic: (_index, _total, baseHue) => baseHue,
    /** Warm reds, oranges, yellows. */
    Warm: (index) => randomRange(0, 60) + index % 2 * 300,
    /** Cool blues, greens, purples. */
    Cool: () => randomRange(180, 270),
    /** Vivid neon palette cycled through magenta, lime, cyan etc. */
    Neon: (index) => {
      const neonHues = [300, 60, 120, 180, 240, 0];
      return neonHues[index % neonHues.length];
    },
    /** Sunset oranges, reds, pinks. */
    Sunset: (index) => {
      const sunsetHues = [15, 30, 45, 330, 345];
      return sunsetHues[index % sunsetHues.length];
    },
    /** Ocean blues and teals. */
    Ocean: (index) => {
      const oceanHues = [180, 200, 220, 240, 160];
      return oceanHues[index % oceanHues.length];
    },
    /** Forest greens. */
    Forest: (index) => {
      const forestHues = [120, 140, 90, 100, 80];
      return forestHues[index % forestHues.length];
    },
    /** Galaxy purples and deep blues. */
    Galaxy: (index) => {
      const galaxyHues = [240, 280, 300, 260, 220];
      return galaxyHues[index % galaxyHues.length];
    },
    /** Fire reds, oranges, yellows. */
    Fire: (index) => {
      const fireHues = [0, 15, 30, 45, 60];
      return fireHues[index % fireHues.length];
    },
    /** Ice — light blues and cyans. */
    Ice: (index) => {
      const iceHues = [180, 190, 200, 210, 220];
      return iceHues[index % iceHues.length];
    },
    /** Cyberpunk magentas, cyans, limes. */
    Cyberpunk: (index) => {
      const cyberpunkHues = [300, 180, 60, 320, 200];
      return cyberpunkHues[index % cyberpunkHues.length];
    },
    /** Random hues — paired with reduced saturation for soft pastels. */
    Pastel: () => random() * 360,
    /** Vintage warm browns and muted blues. */
    Vintage: (index) => {
      const vintageHues = [30, 45, 60, 200, 220];
      return vintageHues[index % vintageHues.length];
    },
    /** Smooth gradient sweeping 60° starting from the base hue. */
    Gradient: (index, total, baseHue) => (baseHue + index / total * 60) % 360,
    /** Bright saturated electric colors. */
    Electric: (index) => {
      const electricHues = [60, 120, 180, 240, 300];
      return electricHues[index % electricHues.length];
    },
    /** Full rainbow — evenly distributes hues across all lines. */
    Rainbow: (index, total) => index / total * 360,
    /** Pure random hue per line. */
    Random: () => random() * 360
  };
}

// src/shared/generateSphereConfig.ts
function generateSphereConfig(cfg, rng, colorSchemes = createColorSchemes(rng.random, rng.randomRange)) {
  const { random, randomRange, randomInt } = rng;
  const colorSchemeNames = Object.keys(colorSchemes);
  const lineCount = randomInt(cfg.minLines, cfg.maxLines);
  const sphereSize = randomInt(cfg.minSphereSize, cfg.maxSphereSize);
  const lineWidth = randomRange(cfg.minLineWidth, cfg.maxLineWidth);
  const glowIntensity = randomRange(cfg.minGlowIntensity, cfg.maxGlowIntensity);
  const rotationSpeed = randomRange(cfg.minRotationSpeed, cfg.maxRotationSpeed);
  const colorSchemeName = colorSchemeNames[randomInt(0, colorSchemeNames.length - 1)];
  const colorSchemeFunc = colorSchemes[colorSchemeName];
  let saturation = randomInt(cfg.minSaturation, cfg.maxSaturation);
  let lightness = randomInt(cfg.minLightness, cfg.maxLightness);
  if (colorSchemeName === "Pastel") {
    saturation = randomInt(30, 50);
    lightness = randomInt(70, 85);
  } else if (colorSchemeName === "Neon" || colorSchemeName === "Electric") {
    saturation = randomInt(85, 100);
    lightness = randomInt(50, 70);
  } else if (colorSchemeName === "Vintage") {
    saturation = randomInt(40, 60);
    lightness = randomInt(40, 60);
  } else if (colorSchemeName === "Monochromatic") {
    lightness = randomInt(30, 80);
  }
  const baseHue = random() * 360;
  const lines = [];
  for (let i = 0; i < lineCount; i++) {
    const hue = colorSchemeFunc(i, lineCount, baseHue);
    let lineLightness = lightness;
    if (colorSchemeName === "Monochromatic") {
      lineLightness = randomInt(30, 80);
    }
    lines.push({
      id: i,
      angleX: random() * 360,
      angleY: random() * 360,
      angleZ: random() * 360,
      hue,
      speed: randomRange(0.5, 1.5),
      customLightness: colorSchemeName === "Monochromatic" ? lineLightness : void 0
    });
  }
  return {
    lines,
    sphereSize,
    lineWidth,
    glowIntensity,
    rotationSpeed,
    saturation,
    lightness,
    colorScheme: colorSchemeName
  };
}

// src/react/useSphereConfig.ts
function useSphereConfig(config, rng) {
  const colorSchemes = useMemo(
    () => createColorSchemes(rng.random, rng.randomRange),
    [rng.random, rng.randomRange]
  );
  return useCallback2(
    (cfg = config) => generateSphereConfig(cfg, rng, colorSchemes),
    [config, rng, colorSchemes]
  );
}

// src/react/QuantumOrbital.tsx
import { jsx } from "react/jsx-runtime";
function QuantumOrbital({
  config = DEFAULT_ORBITAL_SPHERE_CONFIG,
  autoRandomize = true,
  className = "",
  onSphereClick = null
}) {
  const rng = useRandom();
  const { randomRange } = rng;
  const generateSphereConfig2 = useSphereConfig(config, rng);
  const [sphereData, setSphereData] = useState(() => generateSphereConfig2(config));
  const [hueShift, setHueShift] = useState(0);
  const [hoveredLineId, setHoveredLineId] = useState(null);
  const [hoverEffects, setHoverEffects] = useState({});
  const sphereRef = useRef2(null);
  const timeoutIdRef = useRef2(null);
  const hueTimeoutIdRef = useRef2(null);
  const handleMouseMove = useCallback3(
    (event) => {
      if (!sphereRef.current) return;
      const sphereRect = sphereRef.current.getBoundingClientRect();
      const isOverSphere = event.clientX >= sphereRect.left && event.clientX <= sphereRect.right && event.clientY >= sphereRect.top && event.clientY <= sphereRect.bottom;
      if (!isOverSphere) {
        setHoveredLineId(null);
        return;
      }
      const elementFromPoint = document.elementFromPoint(event.clientX, event.clientY);
      if (elementFromPoint && elementFromPoint.dataset.lineId) {
        const lineId = Number.parseInt(elementFromPoint.dataset.lineId);
        if (lineId !== hoveredLineId) {
          setHoveredLineId(lineId);
          setHoverEffects({
            hueShift: randomRange(-90, 90),
            saturationBoost: randomRange(10, 30),
            lightnessShift: randomRange(-20, 20),
            glowMultiplier: randomRange(1.5, 3),
            speedMultiplier: randomRange(0.3, 2.5),
            scaleMultiplier: randomRange(1.1, 1.4)
          });
        }
      } else {
        setHoveredLineId(null);
      }
    },
    [hoveredLineId, randomRange]
  );
  const handleSphereClick = useCallback3(
    (_event) => {
      if (onSphereClick) {
        onSphereClick();
      }
    },
    [onSphereClick]
  );
  const styleForLine = useCallback3(
    (line) => getLineStyle(line, sphereData, hueShift, hoveredLineId, hoverEffects, config.opacity),
    [hoveredLineId, hueShift, sphereData, hoverEffects, config.opacity]
  );
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);
  useEffect(() => {
    if (!autoRandomize) return;
    const scheduleNext = () => {
      setSphereData(generateSphereConfig2(config));
      const delay = randomRange(config.autoRandomizeMin, config.autoRandomizeMax);
      timeoutIdRef.current = window.setTimeout(scheduleNext, delay);
    };
    const scheduleHueShift = () => {
      setHueShift((prev) => (prev + randomRange(10, 50)) % 360);
      const delay = randomRange(2e3, 6e3);
      hueTimeoutIdRef.current = window.setTimeout(scheduleHueShift, delay);
    };
    scheduleNext();
    scheduleHueShift();
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (hueTimeoutIdRef.current) clearTimeout(hueTimeoutIdRef.current);
    };
  }, [autoRandomize]);
  return /* @__PURE__ */ jsx("div", { className: `relative flex justify-center items-center ${className}`, children: /* @__PURE__ */ jsx("div", { className: "relative z-10", onClick: handleSphereClick, ref: sphereRef, children: /* @__PURE__ */ jsx(
    "div",
    {
      className: "relative cursor-pointer orbital-sphere",
      style: {
        transformStyle: "preserve-3d",
        animation: `orbitalSpin ${sphereData.rotationSpeed}s infinite linear`,
        width: `${sphereData.sphereSize}px`,
        height: `${sphereData.sphereSize}px`
      },
      children: sphereData.lines.map((line) => {
        const lineStyle = styleForLine(line);
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 rounded-full border-solid transition-all duration-200 ease-in-out orbital-line",
            "data-line-id": line.id,
            style: {
              transform: lineStyle.transform,
              borderColor: lineStyle.borderColor,
              borderWidth: lineStyle.borderWidth,
              boxShadow: lineStyle.boxShadow,
              animationDuration: lineStyle.animationDuration,
              zIndex: lineStyle.zIndex
            }
          },
          line.id
        );
      })
    }
  ) }) });
}
export {
  QuantumOrbital,
  QuantumOrbital as default
};
//# sourceMappingURL=index.js.map