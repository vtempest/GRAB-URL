var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  QuantumOrbital: () => QuantumOrbital,
  default: () => QuantumOrbital,
});
module.exports = __toCommonJS(index_exports);

// src/react/QuantumOrbital.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function QuantumOrbital({
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
    autoRandomizeMin: 5e3,
    autoRandomizeMax: 12e3,
    opacity: 0.75,
  },
  autoRandomize = true,
  className = "",
  onSphereClick = null,
}) {
  const seedRef = (0, import_react.useRef)(Date.now() % 2147483647);
  const random = (0, import_react.useCallback)(() => {
    seedRef.current = (seedRef.current * 16807) % 2147483647;
    return (seedRef.current - 1) / 2147483646;
  }, []);
  const randomRange = (0, import_react.useCallback)(
    (min, max) => min + random() * (max - min),
    [random],
  );
  const randomInt = (0, import_react.useCallback)(
    (min, max) => Math.floor(randomRange(min, max + 1)),
    [randomRange],
  );
  const colorSchemes = (0, import_react.useMemo)(
    () => ({
      Single: (index, total, baseHue) => baseHue,
      Dual: (index, total, baseHue) =>
        index % 2 === 0 ? baseHue : (baseHue + 180) % 360,
      Complementary: (index, total, baseHue) =>
        index % 2 === 0 ? baseHue : (baseHue + 180) % 360,
      Triadic: (index, total, baseHue) => baseHue + (index % 3) * 120,
      Analogous: (index, total, baseHue) => (baseHue + index * 30) % 360,
      Split: (index, total, baseHue) => {
        const angles = [0, 150, 210];
        return (baseHue + angles[index % 3]) % 360;
      },
      Tetradic: (index, total, baseHue) => baseHue + (index % 4) * 90,
      Monochromatic: (index, total, baseHue) => baseHue,
      Warm: (index, total) => randomRange(0, 60) + (index % 2) * 300,
      // Reds, oranges, yellows
      Cool: (index, total) => randomRange(180, 270),
      // Blues, greens, purples
      Neon: (index, total) => {
        const neonHues = [300, 60, 120, 180, 240, 0];
        return neonHues[index % neonHues.length];
      },
      Sunset: (index, total) => {
        const sunsetHues = [15, 30, 45, 330, 345];
        return sunsetHues[index % sunsetHues.length];
      },
      Ocean: (index, total) => {
        const oceanHues = [180, 200, 220, 240, 160];
        return oceanHues[index % oceanHues.length];
      },
      Forest: (index, total) => {
        const forestHues = [120, 140, 90, 100, 80];
        return forestHues[index % forestHues.length];
      },
      Galaxy: (index, total) => {
        const galaxyHues = [240, 280, 300, 260, 220];
        return galaxyHues[index % galaxyHues.length];
      },
      Fire: (index, total) => {
        const fireHues = [0, 15, 30, 45, 60];
        return fireHues[index % fireHues.length];
      },
      Ice: (index, total) => {
        const iceHues = [180, 190, 200, 210, 220];
        return iceHues[index % iceHues.length];
      },
      Cyberpunk: (index, total) => {
        const cyberpunkHues = [300, 180, 60, 320, 200];
        return cyberpunkHues[index % cyberpunkHues.length];
      },
      Pastel: (index, total) => random() * 360,
      // Will use reduced saturation
      Vintage: (index, total) => {
        const vintageHues = [30, 45, 60, 200, 220];
        return vintageHues[index % vintageHues.length];
      },
      Gradient: (index, total, baseHue) =>
        (baseHue + (index / total) * 60) % 360,
      // Smooth gradient over 60 degrees
      Electric: (index, total) => {
        const electricHues = [60, 120, 180, 240, 300];
        return electricHues[index % electricHues.length];
      },
    }),
    [randomRange, random],
  );
  const colorSchemeNames = Object.keys(colorSchemes);
  const generateSphereConfig = (0, import_react.useCallback)(
    (cfg = config) => {
      const lineCount = randomInt(cfg.minLines, cfg.maxLines);
      const sphereSize = randomInt(cfg.minSphereSize, cfg.maxSphereSize);
      const lineWidth = randomRange(cfg.minLineWidth, cfg.maxLineWidth);
      const glowIntensity = randomRange(
        cfg.minGlowIntensity,
        cfg.maxGlowIntensity,
      );
      const rotationSpeed = randomRange(
        cfg.minRotationSpeed,
        cfg.maxRotationSpeed,
      );
      const colorSchemeName =
        colorSchemeNames[randomInt(0, colorSchemeNames.length - 1)];
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
          customLightness:
            colorSchemeName === "Monochromatic" ? lineLightness : void 0,
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
        colorScheme: colorSchemeName,
      };
    },
    [config, randomInt, randomRange, random, colorSchemeNames, colorSchemes],
  );
  const [sphereData, setSphereData] = (0, import_react.useState)(() =>
    generateSphereConfig(config),
  );
  const [hueShift, setHueShift] = (0, import_react.useState)(0);
  const [hoveredLineId, setHoveredLineId] = (0, import_react.useState)(null);
  const [hoverEffects, setHoverEffects] = (0, import_react.useState)({});
  const sphereRef = (0, import_react.useRef)(null);
  const timeoutIdRef = (0, import_react.useRef)(null);
  const hueTimeoutIdRef = (0, import_react.useRef)(null);
  const randomizeSphere = (0, import_react.useCallback)(() => {
    setSphereData(generateSphereConfig(config));
  }, [generateSphereConfig, config]);
  const shiftHue = (0, import_react.useCallback)(() => {
    setHueShift((prev) => (prev + randomRange(10, 50)) % 360);
  }, [randomRange]);
  const handleMouseMove = (0, import_react.useCallback)(
    (event) => {
      if (!sphereRef.current) return;
      const sphereRect = sphereRef.current.getBoundingClientRect();
      const isOverSphere =
        event.clientX >= sphereRect.left &&
        event.clientX <= sphereRect.right &&
        event.clientY >= sphereRect.top &&
        event.clientY <= sphereRect.bottom;
      if (!isOverSphere) {
        setHoveredLineId(null);
        return;
      }
      const elementFromPoint = document.elementFromPoint(
        event.clientX,
        event.clientY,
      );
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
            scaleMultiplier: randomRange(1.1, 1.4),
          });
        }
      } else {
        setHoveredLineId(null);
      }
    },
    [hoveredLineId, randomRange],
  );
  const handleSphereClick = (0, import_react.useCallback)(
    (event) => {
      if (onSphereClick) {
        onSphereClick();
      }
    },
    [onSphereClick],
  );
  const getLineStyle = (0, import_react.useCallback)(
    (line) => {
      const isHovered = hoveredLineId === line.id;
      let finalHue = (line.hue + hueShift) % 360;
      let finalSaturation = sphereData.saturation;
      let finalLightness = line.customLightness || sphereData.lightness;
      let finalGlow = sphereData.glowIntensity;
      let finalSpeed = sphereData.rotationSpeed * line.speed;
      let finalScale = 1;
      if (isHovered) {
        finalHue = (finalHue + hoverEffects.hueShift) % 360;
        finalSaturation = Math.min(
          100,
          finalSaturation + hoverEffects.saturationBoost,
        );
        finalLightness = Math.max(
          0,
          Math.min(100, finalLightness + hoverEffects.lightnessShift),
        );
        finalGlow *= hoverEffects.glowMultiplier;
        finalSpeed *= hoverEffects.speedMultiplier;
        finalScale = hoverEffects.scaleMultiplier;
      }
      const color = `hsla(${finalHue}, ${finalSaturation}%, ${finalLightness}%, ${config.opacity})`;
      return {
        transform: `rotateX(${line.angleX}deg) rotateY(${line.angleY}deg) rotateZ(${line.angleZ}deg) scale(${finalScale})`,
        borderColor: color,
        borderWidth: `${sphereData.lineWidth}px`,
        boxShadow: `0 0 ${finalGlow}px ${color}`,
        animationDuration: `${finalSpeed}s`,
        zIndex: isHovered ? 10 : 1,
      };
    },
    [hoveredLineId, hueShift, sphereData, hoverEffects, config.opacity],
  );
  (0, import_react.useEffect)(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);
  (0, import_react.useEffect)(() => {
    if (!autoRandomize) return;
    const scheduleNext = () => {
      setSphereData(generateSphereConfig(config));
      const delay = randomRange(
        config.autoRandomizeMin,
        config.autoRandomizeMax,
      );
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    className: `relative flex justify-center items-center ${className}`,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      className: "relative z-10",
      onClick: handleSphereClick,
      ref: sphereRef,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
        className: "relative cursor-pointer orbital-sphere",
        style: {
          transformStyle: "preserve-3d",
          animation: `orbitalSpin ${sphereData.rotationSpeed}s infinite linear`,
          width: `${sphereData.sphereSize}px`,
          height: `${sphereData.sphereSize}px`,
        },
        children: sphereData.lines.map((line) => {
          const lineStyle = getLineStyle(line);
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              className:
                "absolute inset-0 rounded-full border-solid transition-all duration-200 ease-in-out orbital-line",
              "data-line-id": line.id,
              style: {
                transform: lineStyle.transform,
                borderColor: lineStyle.borderColor,
                borderWidth: lineStyle.borderWidth,
                boxShadow: lineStyle.boxShadow,
                animationDuration: lineStyle.animationDuration,
                zIndex: lineStyle.zIndex,
              },
            },
            line.id,
          );
        }),
      }),
    }),
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    QuantumOrbital,
  });
//# sourceMappingURL=index.cjs.map
