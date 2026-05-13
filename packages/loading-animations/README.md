# @grab-url/loading-animations

Two tree-shakable collections of loading animations:

- **SVG** — 17 animated SVG spinners for the browser, each rendered by a single function call. Customize colors, size, width, and height per call.
- **CLI** — Unicode/emoji spinner frame data for terminal UIs (used by [`@grab-url/cli`](../grab-url-cli)).

Both are zero-dependency and named-exported so bundlers strip out anything you don't use.

## Install (within the monorepo)

```json
{ "dependencies": { "@grab-url/loading-animations": "*" } }
```

## SVG usage

```ts
import { loadingSpinner, loadingRing, loadingPacman } from "@grab-url/loading-animations/svg";

// Returns an SVG string you can drop into innerHTML / dangerouslySetInnerHTML
element.innerHTML = loadingSpinner({
  colors: ["#0099e5", "#ff4c4c"], // override existing colors in order
  size: 100,                       // shorthand for width + height
});

// Or specify dimensions independently
element.innerHTML = loadingRing({ width: 64, height: 64 });
```

### Available SVG spinners

`loadingBouncyBall`, `loadingDoubleRing`, `loadingEclipse`, `loadingEllipsis`, `loadingFloatingSearch`, `loadingGears`, `loadingInfinity`, `loadingOrbital`, `loadingPacman`, `loadingPulseBars`, `loadingRedBlueBall`, `loadingReloadArrow`, `loadingRing`, `loadingRipple`, `loadingSpinner`, `loadingSpinnerOval`, `loadingSquareBlocks`.

Each accepts a `LoadingOptions` object:

```ts
type LoadingOptions = {
  colors?: string[]; // hex colors to substitute, in source order
  width?: number;    // default 200
  height?: number;   // default 200
  size?: number;     // shorthand: sets both width and height
};
```

The raw `.svg` files also live in [svg/](svg/) if you need to reference them directly.

## CLI usage

Each terminal spinner is either a plain `string` (1 char per frame) or a `[string, n]` tuple where `n` is the character length of each frame.

```js
import { dots, bouncingBar } from "@grab-url/loading-animations";

// Plain string (n = 1) — split per character
const frames = [...dots]; // ["⠋", "⠙", "⠹", ...]

// Tuple — split into chunks of n characters
const [data, n] = Array.isArray(bouncingBar) ? bouncingBar : [bouncingBar, 1];
const frames2 = data.match(new RegExp(`.{1,${n}}`, "g"));
```

Includes `dots`, `dots2`–`dots14`, `dotsCircle`, `sand`, `line`, `pipe`, `simpleDotsScrolling`, `star`, `flip`, `growVertical`, `growHorizontal`, `balloon`, `balloon2`, `noise`, `boxBounce`, `boxBounce2`, `triangle`, `arc`, `circle`, `squareCorners`, `circleQuarters`, `circleHalves`, `squish`, `toggle3`–`toggle8`, and more.

## What's in this package

| Path                                                        | Purpose                                          |
| ----------------------------------------------------------- | ------------------------------------------------ |
| [svg/index.ts](svg/index.ts)                                | Auto-generated barrel of customizable SVG spinners |
| [svg/*.svg](svg/)                                           | Source SVG files                                 |
| [cli/index.js](cli/index.js)                                | Barrel re-export for terminal spinners           |
| [cli/loading-animations-emojis.js](cli/loading-animations-emojis.js) | Frame data for terminal spinners                 |

## License

MIT
