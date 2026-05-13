# @grab-url/log

Tiny colorized logger that works in **both the browser and Node.js**. Logs strings or objects, and for objects also renders a compact, color-coded view of the JSON's structure (types, not values) alongside the pretty-printed JSON itself.

Used internally by [`grab-url`](https://grab.js.org) — exposed as the global `log()` in the browser and on `globalThis` in Node.

## Usage

```ts
import { log } from "@grab-url/log";

log("hello world");                          // simple colored line
log("error", { color: "red" });              // named color
log({ user: { id: 1, name: "Ada" } });        // structure + JSON
log("with %c style", { color: ["cyan"] });    // multi-color via %c placeholders
```

### Spinner

```ts
log("loading...", { startSpinner: true, color: "yellow" });
// ...do work...
log("done", { stopSpinner: true });
```

### Hide in production

By default, logs are routed to `console.debug` (and effectively hidden) when running on a non-localhost host. Override explicitly:

```ts
log("verbose", { hideInProduction: false });
```

## API

```ts
type LogOptions = {
  color?: ColorName | ColorName[]; // single color or array (with %c placeholders)
  style?: string;                   // CSS-style string for browser console
  hideInProduction?: boolean;       // auto-detected from window.location.hostname
  startSpinner?: boolean;           // begin a terminal spinner alongside the message
  stopSpinner?: boolean;            // stop the active spinner and finalize the line
};

log(message: string | object, options?: LogOptions): true;
```

Other exports:

```ts
import { ColorName, getColors, printJSONStructure } from "@grab-url/log";
```

- **`ColorName`** — enum of supported color names: `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`, `brightRed`…`brightWhite`, plus background variants (`bgRed`, `bgGreen`, …).
- **`getColors()`** — returns the ANSI code map for the current environment.
- **`printJSONStructure(value)`** — renders a colored type-only outline of any value (`{ user: { id: number, name: "" } }`). Strings render as `""`, numbers as `number`, booleans as `bool`, arrays as `[type]` of their first element, etc.

## What's in this package

| File                              | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| [log-json.ts](log-json.ts)        | Main `log()` function and spinner management             |
| [colors.ts](colors.ts)            | `ColorName` enum and ANSI / browser color map            |
| [structure.ts](structure.ts)      | `printJSONStructure`, type detection, indentation helpers |

## License

MIT
