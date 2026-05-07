<script lang="ts">
  /**
   * @module QuantumOrbital
   * Svelte implementation of the QuantumOrbital animated loader.
   *
   * Inspired by quantum superposition of atomic orbitals and the
   * [wave function collapse](https://en.wikipedia.org/wiki/Wave_function_collapse).
   * The sphere periodically re-randomizes (color scheme, line count, glow,
   * rotation) and reacts to mouse hover with per-line color/glow flair.
   *
   * @author [vtempest](https://github.com/vtempest)
   */
  import { onMount, onDestroy } from "svelte";
  import type {
    HoverEffects,
    OrbitalLine,
    OrbitalSphereProps,
    SphereData,
  } from "../types/QuantumOrbital";
  import { DEFAULT_ORBITAL_SPHERE_CONFIG } from "../shared/defaults";
  import { createRandom } from "../shared/random";
  import { generateSphereConfig as buildSphereConfig } from "../shared/generateSphereConfig";
  import { getLineStyle } from "../shared/getLineStyle";

  let {
    config = DEFAULT_ORBITAL_SPHERE_CONFIG,
    autoRandomize = true,
    className = "",
    onSphereClick = null,
  } = $props() as OrbitalSphereProps;

  // Seeded RNG instance, stable for the component's lifetime.
  const rng = createRandom();
  const { randomRange } = rng;

  /** Build a fresh sphere config bound to this component's RNG. */
  const generateSphereConfig = (cfg = config): SphereData =>
    buildSphereConfig(cfg, rng);

  // Reactive state
  let sphereData = $state<SphereData>(generateSphereConfig(config));
  let hueShift = $state<number>(0);
  let hoveredLineId = $state<number | null>(null);
  let hoverEffects = $state<HoverEffects>({} as HoverEffects);
  let sphereRef: HTMLElement | null = $state(null);
  let timeoutId: number | null = null;
  let hueTimeoutId: number | null = null;

  /** Replace the current sphere with a freshly randomized one. */
  const randomizeSphere = (): void => {
    sphereData = generateSphereConfig(config);
  };

  /** Bump the global hue shift by a random amount in [10, 50) degrees. */
  const shiftHue = (): void => {
    hueShift = (hueShift + randomRange(10, 50)) % 360;
  };

  /**
   * Document-level pointer tracker. Determines whether the cursor is over the
   * sphere and, if so, which orbital line is under it (via `data-line-id`).
   * Picks a fresh batch of {@link HoverEffects} on hover transitions.
   */
  const handleMouseMove = (event: MouseEvent): void => {
    if (!sphereRef) return;

    const sphereRect = sphereRef.getBoundingClientRect();
    const isOverSphere =
      event.clientX >= sphereRect.left &&
      event.clientX <= sphereRect.right &&
      event.clientY >= sphereRect.top &&
      event.clientY <= sphereRect.bottom;

    if (!isOverSphere) {
      hoveredLineId = null;
      return;
    }

    const elementFromPoint = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );
    if (elementFromPoint && (elementFromPoint as HTMLElement).dataset.lineId) {
      const lineId = parseInt(
        (elementFromPoint as HTMLElement).dataset.lineId!,
      );
      if (lineId !== hoveredLineId) {
        hoveredLineId = lineId;
        hoverEffects = {
          hueShift: randomRange(-90, 90),
          saturationBoost: randomRange(10, 30),
          lightnessShift: randomRange(-20, 20),
          glowMultiplier: randomRange(1.5, 3),
          speedMultiplier: randomRange(0.3, 2.5),
          scaleMultiplier: randomRange(1.1, 1.4),
        };
      }
    } else {
      hoveredLineId = null;
    }
  };

  /** Forwards a click on the sphere container to the user-supplied callback. */
  const handleSphereClick = (_event: MouseEvent): void => {
    if (onSphereClick) {
      onSphereClick();
    }
  };

  /** Resolve the inline style for one orbital line via the shared helper. */
  const styleForLine = (line: OrbitalLine) =>
    getLineStyle(
      line,
      sphereData,
      hueShift,
      hoveredLineId,
      hoverEffects,
      config.opacity,
    );

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);

    if (autoRandomize) {
      const scheduleNext = () => {
        randomizeSphere();
        const delay = randomRange(
          config.autoRandomizeMin,
          config.autoRandomizeMax,
        );
        timeoutId = window.setTimeout(scheduleNext, delay);
      };

      const scheduleHueShift = () => {
        shiftHue();
        const delay = randomRange(2000, 6000);
        hueTimeoutId = window.setTimeout(scheduleHueShift, delay);
      };

      scheduleNext();
      scheduleHueShift();
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
      if (hueTimeoutId) clearTimeout(hueTimeoutId);
    };
  });

  onDestroy(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    if (timeoutId) clearTimeout(timeoutId);
    if (hueTimeoutId) clearTimeout(hueTimeoutId);
  });
</script>

<div
  class="relative w-full h-full flex justify-center items-center p-2.5 overflow-hidden {className}"
>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="relative z-10" onclick={handleSphereClick} bind:this={sphereRef}>
    <div
      class="relative cursor-pointer orbital-sphere"
      style="
        transform-style: preserve-3d;
        animation: orbitalSpin {sphereData.rotationSpeed}s infinite linear;
        width: {sphereData.sphereSize}px;
        height: {sphereData.sphereSize}px;
      "
    >
      {#each sphereData.lines as line (line.id)}
        {@const lineStyle = styleForLine(line)}
        <div
          class="absolute inset-0 rounded-full border-solid transition-all duration-200 ease-in-out orbital-line"
          data-line-id={line.id}
          style="
            transform: {lineStyle.transform};
            border-color: {lineStyle.borderColor};
            border-width: {lineStyle.borderWidth};
            box-shadow: {lineStyle.boxShadow};
            animation-duration: {lineStyle.animationDuration};
            z-index: {lineStyle.zIndex};
          "
        ></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .orbital-sphere {
    perspective: 1000px;
  }

  @keyframes orbitalSpin {
    from {
      transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    }
    to {
      transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
    }
  }

  @keyframes orbitalLineSpin {
    from {
      transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    }
    to {
      transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
    }
  }

  .orbital-line {
    animation: orbitalLineSpin infinite linear;
  }
</style>
