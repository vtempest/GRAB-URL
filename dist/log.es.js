function log(message = "", options = {}) {
  let {
    color,
    style = "color:rgb(54, 165, 220); font-size: 10pt;",
    hideInProduction = void 0,
    startSpinner = false,
    stopSpinner = false
  } = options;
  const colors = getColors();
  if (typeof hideInProduction === "undefined")
    hideInProduction = typeof window !== "undefined" && window?.location.hostname.includes("localhost");
  if (typeof message === "object")
    message = printJSONStructure(message) + "\n\n" + JSON.stringify(message, null, 2);
  if (Array.isArray(color) && color.length == 1) color = color[0];
  if (color && typeof process !== void 0) {
    if (message.includes("%c") && Array.isArray(color))
      message = message.replace(/%c/g, (match, index) => colors[color[index]] || "");
    else if (color && typeof color === "string")
      message = (colors[color] || "") + message + colors.reset;
  }
  var i = 0;
  if (startSpinner)
    (global || globalThis).interval = setInterval(() => {
      process.stdout.write(
        (Array.isArray(color) ? colors[color[0]] : colors[color] || "") + "\r" + "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("")[i = ++i % 10] + " " + message + colors.reset
      );
    }, 50);
  else if (stopSpinner) {
    clearInterval((global || globalThis).interval);
    process.stdout.write(
      "\r" + (message || " ") + " ".repeat(message.length + 20) + "\n"
    );
  } else if (typeof style === "string") {
    if (style.split(" ").length == 1 || color) {
      style = `color: ${color || style}; font-size: 11pt;`;
    } else {
      if (style.match(/^#[0-9a-fA-F]{6}$/)) {
        style = `color: ${style}; font-size: 11pt;`;
      }
    }
    if (hideInProduction)
      console.debug((style ? "%c" : "") + (message || ""), style);
    else console.log((style ? "%c" : "") + (message || ""), style);
  } else if (typeof style === "object") console.log(message, ...style);
  return true;
}
var ColorName = /* @__PURE__ */ ((ColorName2) => {
  ColorName2["RESET"] = "reset";
  ColorName2["BLACK"] = "black";
  ColorName2["RED"] = "red";
  ColorName2["GREEN"] = "green";
  ColorName2["YELLOW"] = "yellow";
  ColorName2["BLUE"] = "blue";
  ColorName2["MAGENTA"] = "magenta";
  ColorName2["CYAN"] = "cyan";
  ColorName2["WHITE"] = "white";
  ColorName2["GRAY"] = "gray";
  ColorName2["BRIGHT_RED"] = "brightRed";
  ColorName2["BRIGHT_GREEN"] = "brightGreen";
  ColorName2["BRIGHT_YELLOW"] = "brightYellow";
  ColorName2["BRIGHT_BLUE"] = "brightBlue";
  ColorName2["BRIGHT_MAGENTA"] = "brightMagenta";
  ColorName2["BRIGHT_CYAN"] = "brightCyan";
  ColorName2["BRIGHT_WHITE"] = "brightWhite";
  ColorName2["BG_RED"] = "bgRed";
  ColorName2["BG_GREEN"] = "bgGreen";
  ColorName2["BG_YELLOW"] = "bgYellow";
  ColorName2["BG_BLUE"] = "bgBlue";
  ColorName2["BG_MAGENTA"] = "bgMagenta";
  ColorName2["BG_CYAN"] = "bgCyan";
  ColorName2["BG_WHITE"] = "bgWhite";
  ColorName2["BG_GRAY"] = "bgGray";
  ColorName2["BG_BLACK"] = "bgBlack";
  ColorName2["BG_BRIGHT_RED"] = "bgBrightRed";
  ColorName2["BG_BRIGHT_GREEN"] = "bgBrightGreen";
  ColorName2["BG_BRIGHT_YELLOW"] = "bgBrightYellow";
  ColorName2["BG_BRIGHT_BLUE"] = "bgBrightBlue";
  ColorName2["BG_BRIGHT_MAGENTA"] = "bgBrightMagenta";
  ColorName2["BG_BRIGHT_CYAN"] = "bgBrightCyan";
  ColorName2["BG_BRIGHT_WHITE"] = "bgBrightWhite";
  return ColorName2;
})(ColorName || {});
const colorMap = {
  [
    "reset"
    /* RESET */
  ]: [0, "000000"],
  [
    "black"
    /* BLACK */
  ]: [30, "000000"],
  [
    "red"
    /* RED */
  ]: [31, "ff0000"],
  [
    "green"
    /* GREEN */
  ]: [32, "00ff00"],
  [
    "yellow"
    /* YELLOW */
  ]: [33, "ffff00"],
  [
    "blue"
    /* BLUE */
  ]: [34, "0000ff"],
  [
    "magenta"
    /* MAGENTA */
  ]: [35, "ff00ff"],
  [
    "cyan"
    /* CYAN */
  ]: [36, "00ffff"],
  [
    "white"
    /* WHITE */
  ]: [37, "ffffff"],
  [
    "gray"
    /* GRAY */
  ]: [90, "808080"],
  [
    "brightRed"
    /* BRIGHT_RED */
  ]: [91, "ff5555"],
  [
    "brightGreen"
    /* BRIGHT_GREEN */
  ]: [92, "55ff55"],
  [
    "brightYellow"
    /* BRIGHT_YELLOW */
  ]: [93, "ffff55"],
  [
    "brightBlue"
    /* BRIGHT_BLUE */
  ]: [94, "5555ff"],
  [
    "brightMagenta"
    /* BRIGHT_MAGENTA */
  ]: [95, "ff55ff"],
  [
    "brightCyan"
    /* BRIGHT_CYAN */
  ]: [96, "55ffff"],
  [
    "brightWhite"
    /* BRIGHT_WHITE */
  ]: [97, "ffffff"],
  [
    "bgBlack"
    /* BG_BLACK */
  ]: [40, "000000"],
  [
    "bgRed"
    /* BG_RED */
  ]: [41, "ff0000"],
  [
    "bgGreen"
    /* BG_GREEN */
  ]: [42, "00ff00"],
  [
    "bgYellow"
    /* BG_YELLOW */
  ]: [43, "ffff00"],
  [
    "bgBlue"
    /* BG_BLUE */
  ]: [44, "0000ff"],
  [
    "bgMagenta"
    /* BG_MAGENTA */
  ]: [45, "ff00ff"],
  [
    "bgCyan"
    /* BG_CYAN */
  ]: [46, "00ffff"],
  [
    "bgWhite"
    /* BG_WHITE */
  ]: [47, "ffffff"],
  [
    "bgGray"
    /* BG_GRAY */
  ]: [100, "808080"],
  [
    "bgBrightRed"
    /* BG_BRIGHT_RED */
  ]: [101, "ff8888"],
  [
    "bgBrightGreen"
    /* BG_BRIGHT_GREEN */
  ]: [102, "88ff88"],
  [
    "bgBrightYellow"
    /* BG_BRIGHT_YELLOW */
  ]: [103, "ffff88"],
  [
    "bgBrightBlue"
    /* BG_BRIGHT_BLUE */
  ]: [104, "8888ff"],
  [
    "bgBrightMagenta"
    /* BG_BRIGHT_MAGENTA */
  ]: [105, "ff88ff"],
  [
    "bgBrightCyan"
    /* BG_BRIGHT_CYAN */
  ]: [106, "88ffff"],
  [
    "bgBrightWhite"
    /* BG_BRIGHT_WHITE */
  ]: [107, "ffffff"]
};
function getColors(format = "ansi") {
  const colors = {};
  for (const [name, [ansiCode, hexCode]] of Object.entries(colorMap)) {
    colors[name] = format === "html" ? "#" + hexCode : "\x1B[" + ansiCode + "m";
  }
  return colors;
}
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
function printJSONStructure(obj, indent = 0, colorFormat = "ansi") {
  const colors = getColors(colorFormat);
  const pad = "  ".repeat(indent);
  var result = "";
  if (typeof obj !== "object" || obj === null) {
    const color = getColorForType(obj);
    return color + getTypeString(obj) + colors.reset;
  }
  if (Array.isArray(obj)) {
    result = colors.blue + "[" + colors.reset;
    if (obj.length) result += "\n";
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
  result = colors.green + "{" + colors.reset;
  const keys = Object.keys(obj);
  if (keys.length) result += "\n";
  keys.forEach((key, index) => {
    const value = obj[key];
    const color = getColorForType(value);
    result += pad + "  ";
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result += color + key + colors.reset + ": " + printJSONStructure(value, indent + 1);
    } else if (Array.isArray(value)) {
      result += color + key + colors.reset + ": " + printJSONStructure(value, indent + 1);
    } else {
      result += color + key + ": " + getTypeString(value) + colors.reset;
    }
    if (index < keys.length - 1) result += ",";
    result += "\n";
  });
  result += pad + colors.green + "}" + colors.reset;
  return result;
}
export {
  ColorName,
  getColors,
  log,
  printJSONStructure
};
//# sourceMappingURL=log.es.js.map
