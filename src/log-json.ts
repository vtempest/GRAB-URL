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
    color,
    style = "color:rgb(54, 165, 220); font-size: 10pt;",
    hideInProduction = undefined,
    startSpinner = false,
    stopSpinner = false,
  } = options;
  const colors = getColors();

  // Auto-detect if we should hide logs in production based on hostname
  if (typeof hideInProduction === "undefined")
    hideInProduction =
      typeof window !== "undefined" &&
      window?.location.hostname.includes("localhost");

  // For objects, print both the structure visualization and full JSON
  if (typeof message === "object")
    message =
      printJSONStructure(message) + "\n\n" + JSON.stringify(message, null, 2);

  // change color: [red] to color: red if only one
  if (Array.isArray(color) && color.length == 1) color = color[0];

  //colorize in terminal (%c is only in browser but we polyfill it)
  if (color && typeof process !== undefined)
    if (message.includes("%c") && Array.isArray(color)) // replace each c with color[i]
      message = message.replace(/%c/g, (match, index) => colors[color[index]] || "");
    else if (color && typeof color === "string")
      message = (colors[color] || "") + message + colors.reset;



  //  Displays an animated spinner in the terminal with the provided text.
  var i = 0;

  if (startSpinner)
    (global || globalThis).interval = setInterval(() => {
      process.stdout.write(
        (Array.isArray(color) ? colors[color[0]] : colors[color] || "") +
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
      "\r" + (message || " ") + " ".repeat(message.length + 20) + "\n"
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
  color?: ColorName | ColorName[] | string | string[] ;
  /** If true, hides log in production (auto-detects by hostname if undefined) */
  hideInProduction?: boolean;
  /** Start a spinner (for CLI tools, optional) */
  startSpinner?: boolean;
  /** Stop a spinner (for CLI tools, optional) */
  stopSpinner?: boolean;
}

/**
 * Available color names
 */
export enum ColorName {
  RESET = 'reset',
  BLACK = 'black',
  RED = 'red',
  GREEN = 'green',
  YELLOW = 'yellow',
  BLUE = 'blue',
  MAGENTA = 'magenta',
  CYAN = 'cyan',
  WHITE = 'white',
  GRAY = 'gray',
  BRIGHT_RED = 'brightRed',
  BRIGHT_GREEN = 'brightGreen',
  BRIGHT_YELLOW = 'brightYellow',
  BRIGHT_BLUE = 'brightBlue',
  BRIGHT_MAGENTA = 'brightMagenta',
  BRIGHT_CYAN = 'brightCyan',
  BRIGHT_WHITE = 'brightWhite',
  BG_RED = 'bgRed',
  BG_GREEN = 'bgGreen',
  BG_YELLOW = 'bgYellow',
  BG_BLUE = 'bgBlue',
  BG_MAGENTA = 'bgMagenta',
  BG_CYAN = 'bgCyan',
  BG_WHITE = 'bgWhite',
  BG_GRAY = 'bgGray',
  BG_BLACK = 'bgBlack',
  BG_BRIGHT_RED = 'bgBrightRed',
  BG_BRIGHT_GREEN = 'bgBrightGreen',
  BG_BRIGHT_YELLOW = 'bgBrightYellow',
  BG_BRIGHT_BLUE = 'bgBrightBlue',
  BG_BRIGHT_MAGENTA = 'bgBrightMagenta',
  BG_BRIGHT_CYAN = 'bgBrightCyan',
  BG_BRIGHT_WHITE = 'bgBrightWhite',
}

/**
 * Color mapping with ANSI codes and HTML hex values
 * @type {Record<ColorName, [number, string]>}
 * @description Maps color names to [ansiCode, hexValue] pairs
 * - ansiCode: ANSI escape sequence number for terminal colors
 * - hexValue: Hex color value (without #) for HTML/CSS
 */
const colorMap: Record<ColorName, [number, string]> = {
  [ColorName.RESET]: [0, '000000'],
  [ColorName.BLACK]: [30, '000000'],
  [ColorName.RED]: [31, 'ff0000'],
  [ColorName.GREEN]: [32, '00ff00'],
  [ColorName.YELLOW]: [33, 'ffff00'],
  [ColorName.BLUE]: [34, '0000ff'],
  [ColorName.MAGENTA]: [35, 'ff00ff'],
  [ColorName.CYAN]: [36, '00ffff'],
  [ColorName.WHITE]: [37, 'ffffff'],
  [ColorName.GRAY]: [90, '808080'],
  [ColorName.BRIGHT_RED]: [91, 'ff5555'],
  [ColorName.BRIGHT_GREEN]: [92, '55ff55'],
  [ColorName.BRIGHT_YELLOW]: [93, 'ffff55'],
  [ColorName.BRIGHT_BLUE]: [94, '5555ff'],
  [ColorName.BRIGHT_MAGENTA]: [95, 'ff55ff'],
  [ColorName.BRIGHT_CYAN]: [96, '55ffff'],
  [ColorName.BRIGHT_WHITE]: [97, 'ffffff'],
  [ColorName.BG_BLACK]: [40, '000000'],
  [ColorName.BG_RED]: [41, 'ff0000'],
  [ColorName.BG_GREEN]: [42, '00ff00'],
  [ColorName.BG_YELLOW]: [43, 'ffff00'],
  [ColorName.BG_BLUE]: [44, '0000ff'],
  [ColorName.BG_MAGENTA]: [45, 'ff00ff'],
  [ColorName.BG_CYAN]: [46, '00ffff'],
  [ColorName.BG_WHITE]: [47, 'ffffff'],
  [ColorName.BG_GRAY]: [100, '808080'],
  [ColorName.BG_BRIGHT_RED]: [101, 'ff8888'],
  [ColorName.BG_BRIGHT_GREEN]: [102, '88ff88'],
  [ColorName.BG_BRIGHT_YELLOW]: [103, 'ffff88'],
  [ColorName.BG_BRIGHT_BLUE]: [104, '8888ff'],
  [ColorName.BG_BRIGHT_MAGENTA]: [105, 'ff88ff'],
  [ColorName.BG_BRIGHT_CYAN]: [106, '88ffff'],
  [ColorName.BG_BRIGHT_WHITE]: [107, 'ffffff'],
};

/**
 * Returns color codes based on the specified format
 * @param format - Output format for colors
 *   - 'ansi': Returns ANSI escape codes (e.g., '\x1b[31m')
 *   - 'html': Returns HTML hex colors (e.g., '#ff0000')
 * @returns Object with color names as keys and color codes as values
 */
export function getColors(format: 'html' | 'ansi' = 'ansi'): Record<ColorName, string> {
  const colors: Record<ColorName, string> = {} as Record<ColorName, string>;
  for (const [name, [ansiCode, hexCode]] of Object.entries(colorMap)) {
    colors[name] = format === 'html' ? '#' + hexCode : '\x1b[' + ansiCode + 'm';
  }
  return colors;
}

/**
 * Determines the appropriate color code for a given value type
 * Used for consistent color coding in the structure visualization
 */
function getColorForType(value) {
  const colors = getColors();
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
 * @param {object} obj - The JSON object to visualize
 * @param {number} indent - The number of spaces to indent the object
 * @param {ColorFormat} colorFormat - The color format to use
 * @returns {string} The colored visualization of the JSON object
 */
export function printJSONStructure(obj, indent = 0, colorFormat: 'html' | 'ansi' = 'ansi') {
  const colors = getColors(colorFormat);
  const pad = "  ".repeat(indent);
  var result = "";
  // Handle primitive values and null
  if (typeof obj !== "object" || obj === null) {
    const color = getColorForType(obj);
    return color + getTypeString(obj) + colors.reset;
  }
  // Handle arrays with special bracket formatting
  if (Array.isArray(obj)) {
    result = colors.blue + "[" + colors.reset;
    if (obj.length) result += "\n";
    // if array has items all of the same type or object types, print only once
    if (obj.every((item) => typeof item === typeof obj[0])) {
      result += pad + "  " + printJSONStructure(obj[0], indent + 1);
      result += ",";
      result += "\n";
    } else {
    obj.forEach((item, idx) => {
      result += pad + "  " + printJSONStructure(item, indent + 1);
      if (idx < obj.length - 1) result += ",";
      result += "\n";
    });
    result += pad + colors.blue + "]" + colors.reset;
    return result;
    }
  }

  // Handle objects with special brace and property formatting
  result = colors.green + "{" + colors.reset;
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

