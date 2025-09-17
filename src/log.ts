/**
 * ### Colorized Log With JSON Structure
 * ![Debug log](https://i.imgur.com/R8Qp6Vg.png)
 * Logs messages to the console with custom styling,
 * prints JSON with description of structure layout,
 * and showing debug output in development only.
 * @param {string|object} message - The message to log. If an object is provided, it will be stringified.
 * @param {string|string[]} [options.style] default='color: blue; font-size: 11pt;' - CSS style string
 * @param {boolean} [options.hideInProduction] -  default = auto-detects based on hostname.
 *  If true, uses `console.debug` (hidden in production). If false, uses `console.log`.
 *
 */
export function log(message: string|object  = "", options: LogOptions = {}) {
  let {
    color = null,
    style = "color: #66ccff; font-size: 10pt;",
    hideInProduction = undefined,
    startSpinner = false,
    stopSpinner = false,
  } = options;

  // Auto-detect if we should hide logs in production based on hostname
  if (typeof hideInProduction === "undefined")
    hideInProduction =
      typeof window !== "undefined" &&
      window?.location.hostname.includes("localhost");

  // For objects, print both the structure visualization and full JSON
  if (typeof message === "object")
    message =
      printJSONStructure(message) + "\n\n" + JSON.stringify(message, null, 2);

  //colorize in terminal (%c is only in browser)
  if (color && typeof process !== undefined)
    message = (colors[color] || "") + message + colors.reset;

  //  Displays an animated spinner in the terminal with the provided text.
  var i = 0;

  if (startSpinner)
    (global || globalThis).interval = setInterval(() => {
      process.stdout.write(
        (colors[color] || "") +
          "\r" +
          "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("")[(i = ++i % 10)] +
          " " +
          message +
          colors.reset
      );
    }, 50);
  else if (stopSpinner) {
    clearInterval((global || globalThis).interval);
    process.stdout.write(
      "\r" + (message || "✔ Done") + " ".repeat(message.length + 20) + "\n"
    );
  } else if (typeof style === "string") {
    // check if style is a one word color code or named color
    //test if style is valid as a CSS color name
    if (style.split(" ").length == 1 || color) {
      style = `color: ${color || style}; font-size: 11pt;`;
    } else {
      // check if style is valid as a CSS color code
      if (style.match(/^#[0-9a-fA-F]{6}$/)) {
        style = `color: ${style}; font-size: 11pt;`;
      }
    }
    // Use console.debug for production-hidden logs, console.log otherwise
    if (hideInProduction)
      console.debug((style ? "%c" : "") + (message || ""), style);
    else console.log((style ? "%c" : "") + (message || ""), style);
  } else if (typeof style === "object") console.log(message, ...(style as any));
  return true;
}

export interface LogOptions {
  /** CSS style string or array of CSS strings for browser console styling */
  style?: string | string[];
  /** Optional color name or code for terminal environments */
  color?: keyof typeof colors | null;
  /** If true, hides log in production (auto-detects by hostname if undefined) */
  hideInProduction?: boolean;
  /** Start a spinner (for CLI tools, optional) */
  startSpinner?: boolean;
  /** Stop a spinner (for CLI tools, optional) */
  stopSpinner?: boolean;
}

// ANSI escape codes for terminal colors when running in Node.js
export const colors = {
  reset: "\x1b[0m", // Reset to default color
  black: "\x1b[30m",
  red: "\x1b[31m", // Functions, errors
  green: "\x1b[32m", // Object braces, success
  yellow: "\x1b[33m", // Strings, warnings
  blue: "\x1b[34m", // Array brackets, info
  magenta: "\x1b[35m", // Booleans
  cyan: "\x1b[36m", // Numbers
  white: "\x1b[37m", // Default color, plain text
  gray: "\x1b[90m", // Null, undefined, subtle
  // Bright variants
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
  // Background colors (optional)
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
  bgGray: "\x1b[100m",
};

/**
 * Determines the appropriate color code for a given value type
 * Used for consistent color coding in the structure visualization
 */
function getColorForType(value) {
  if (typeof value === "string") return colors.yellow;
  if (typeof value === "number") return colors.cyan;
  if (typeof value === "boolean") return colors.magenta;
  if (typeof value === "function") return colors.red;
  if (value === null) return colors.gray;
  if (Array.isArray(value)) return colors.blue;
  if (typeof value === "object") return colors.green;
  return colors.white;
}

/**
 * Returns a string representation of the value's type
 * Used to show simplified type information in the structure visualization
 */
function getTypeString(value) {
  if (typeof value === "string") return '""';
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "function") return "function";
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length) return "[" + getTypeString(value[0]) + "]";
    else return "[]";
  }
  if (typeof value === "object") return "{...}";
  return typeof value;
}

/**
 * Creates a colored visualization of a JSON object's structure
 * Shows the shape and types of the data rather than actual values
 * Recursively processes nested objects and arrays
 */
export function printJSONStructure(obj, indent = 0) {
  const pad = "  ".repeat(indent);

  // Handle primitive values and null
  if (typeof obj !== "object" || obj === null) {
    const color = getColorForType(obj);
    return color + getTypeString(obj) + colors.reset;
  }

  // Handle arrays with special bracket formatting
  if (Array.isArray(obj)) {
    let result = colors.blue + "[" + colors.reset;
    if (obj.length) result += "\n";
    obj.forEach((item, idx) => {
      result += pad + "  " + printJSONStructure(item, indent + 1);
      if (idx < obj.length - 1) result += ",";
      result += "\n";
    });
    result += pad + colors.blue + "]" + colors.reset;
    return result;
  }

  // Handle objects with special brace and property formatting
  let result = colors.green + "{" + colors.reset;
  const keys = Object.keys(obj);
  if (keys.length) result += "\n";
  keys.forEach((key, index) => {
    const value = obj[key];
    const color = getColorForType(value);
    result += pad + "  ";

    // Handle nested objects recursively
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result +=
        color +
        key +
        colors.reset +
        ": " +
        printJSONStructure(value, indent + 1);
    }
    // Handle nested arrays recursively
    else if (Array.isArray(value)) {
      result +=
        color +
        key +
        colors.reset +
        ": " +
        printJSONStructure(value, indent + 1);
    }
    // Handle primitive values
    else {
      result += color + key + ": " + getTypeString(value) + colors.reset;
    }
    if (index < keys.length - 1) result += ",";
    result += "\n";
  });
  result += pad + colors.green + "}" + colors.reset;

  // Only log at top level of recursion
  if (indent === 0) {
    // console.log(result);
  }
  return result;
}

/**
 * Shows message in a modal overlay with scrollable message stack
 * and is easier to dismiss unlike alert() which blocks window.
 * Creates a semi-transparent overlay with a white box containing the message.
 * @param {string} msg - The message to display
 */
export function showAlert(msg) {
  if (typeof document === "undefined") return;
  let o = document.getElementById("alert-overlay"),
    list;

  // Create overlay and alert box if they don't exist
  if (!o) {
    o = document.body.appendChild(document.createElement("div"));
    o.id = "alert-overlay";
    o.setAttribute(
      "style",
      "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"
    );
    o.innerHTML = `<div id="alert-box" style="background:#fff;padding:1.5em 2em;border-radius:8px;box-shadow:0 2px 16px #0003;min-width:220px;max-height:80vh;position:relative;display:flex;flex-direction:column;">
      <button id="close-alert" style="position:absolute;top:12px;right:20px;font-size:1.5em;background:none;border:none;cursor:pointer;color:black;">&times;</button>
      <div id="alert-list" style="overflow:auto;flex:1;"></div>
    </div>`;

    // Add click handlers to close overlay
    o.addEventListener("click", (e) => e.target == o && o.remove());
    document.getElementById("close-alert").onclick = () => o.remove();
  }

  list = o.querySelector("#alert-list");

  // Add new message to list
  list.innerHTML += `<div style="border-bottom:1px solid #333; font-size:1.2em;margin:0.5em 0;">${msg}</div>`;
}

/**
 * Sets up development tools for debugging API requests
 * Adds a keyboard shortcut (Ctrl+I) that shows a modal with request history
 * Each request entry shows:
 * - Request path
 * - Request details
 * - Response data
 * - Timestamp
 */
export function setupDevTools() {
  // Keyboard shortcut (Ctrl+I) to toggle debug view
  document.addEventListener("keydown", (e) => {
    if (e.key === "i" && e.ctrlKey) {
      // Create HTML of the grab.log requests
      let html = " ";
      for (let request of grab.log) {
        html += `<div style="margin-bottom:1em; border-bottom:1px solid #ccc; padding-bottom:1em;">
          <b>Path:</b> ${request.path}<br>
          <b>Request:</b> ${request.request}<br>
          <b>Response:</b> ${JSON.stringify(request.response, null, 2)}<br>
          <b>Time:</b> ${new Date(request.lastFetchTime).toLocaleString()}
        </div>`;
      }
      showAlert(html);
    }
  });
}

/**
 * Displays an animated spinner in the terminal with the provided text.
 * The spinner animates in-place until the returned function is called,
 * which stops the spinner and prints a success message.
 * @param {string} text - The text to display next to the spinner animation.
 * @returns {(success?: string) => void} Stop function with optional message.
 * @example
 * const stopSpinner = showSpinnerInTerminal('Downloading...');
 * setTimeout(() => {
 *    stopSpinner('Success!');
 * }, 2000);
 */
export function showSpinnerInTerminal(text) {
  let i = 0,
    interval = setInterval(() => {
      process.stdout.write(
        "\r" + "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("")[(i = ++i % 10)] + " " + text
      );
    }, 50);

  return function (success = "✔ Done!") {
    clearInterval(interval);
    process.stdout.write("\r" + success + " ".repeat(text.length) + "\n");
  };
}
