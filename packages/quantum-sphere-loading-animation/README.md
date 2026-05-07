https://i.imgur.com/wySaMJl.png



# Quantum Sphere Loading

https://github.com/user-attachments/assets/903f2483-6fac-4592-be09-5fdc17196a84

## [DEMO](https://v0-quantum-sphere-demo.vercel.app)

A parabolic spherical orbital loading component, inspired by [quantum superposition of atomic orbitals](https://www.thoughtco.com/definition-of-molecular-orbital-605367) and the wave function collapse concept. Particles occupy multiple quantum states until interacting (hovering), creating a mesmerizing, high-performance UI element.

Available for both **React** and **Svelte 5**.

## Features

- ⚛️ **Physics-based Animation**: Lines rotate in 3D space with parabolic trajectories
- 🎨 **Dynamic Color Schemes**: 20+ preset color schemes (Neon, Cyberpunk, Galaxy, etc.)
- 🖱️ **Interactive**: Hover effects simulate wave function collapse (particles react to observation)
- ⚙️ **Highly Configurable**: Control line count, sphere size, speed, glow, and more
- 🎭 **Dual Framework Support**: First-class support for both React and Svelte 5

## Installation

```
bun i quantum-sphere-loading-icon

```

## Usage

### React

```tsx
import React from 'react';
import QuantumWaveOrbital from 'quantum-sphere-loading-icon';

function App() {
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <QuantumWaveOrbital 
        autoRandomize={true} 
        onSphereClick={() => console.log('Sphere clicked')} 
        className="my-custom-class"
      />
    </div>
  );
}
```

### Svelte (v5)

```svelte
<script>
  import QuantumWaveOrbital from 'quantum-sphere-loading-icon/svelte';
</script>

<div class="container">
  <QuantumWaveOrbital 
    autoRandomize={true}
    onSphereClick={() => console.log('Sphere clicked')}
  />
</div>

<style>
  .container {
    height: 500px;
    width: 100%;
  }
</style>
```

## Configuration

You can customize the sphere by passing a `config` prop/prop.

```tsx
// Example custom config
const myConfig = {
  minLines: 8,
  maxLines: 16,
  minSphereSize: 150,
  maxSphereSize: 200,
  minRotationSpeed: 5,
  maxRotationSpeed: 20,
  // ... see types for full list
};

<QuantumWaveOrbital config={myConfig} />
```

### Props / API

| Prop              | Type                    | Default          | Description                                                           |
| ----------------- | ----------------------- | ---------------- | --------------------------------------------------------------------- |
| `config`        | `OrbitalSphereConfig` | (Default Preset) | detailed configuration object                                         |
| `autoRandomize` | `boolean`             | `true`         | Periodically changes the sphere's configuration (colors, lines, size) |
| `className`     | `string`              | `""`           | Additional CSS classes for the container                              |
| `onSphereClick` | `() => void`          | `null`         | Callback when the sphere is clicked                                   |

### OrbitalSphereConfig Interface

See `src/QuantumSphere.d.ts` (or your IDE's autocomplete) for the full list of configuration options, including:

- `minLines` / `maxLines`
- `minSphereSize` / `maxSphereSize`
- `minGlowIntensity` / `maxGlowIntensity`
- `minSaturation` / `maxSaturation`
- `autoRandomizeMin` / `autoRandomizeMax` (ms)

## License

MIT © [vtempest](https://github.com/vtempest)
