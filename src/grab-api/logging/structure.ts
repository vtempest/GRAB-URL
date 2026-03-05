/**
 * @file logging/structure.ts
 * @description Utility for visualizing nested JSON object structures.
 * Provides color-coded type descriptions and hierarchical indentation.
 */

import { ColorName, getColors } from "./colors";

/**
 * Determines the appropriate color code for a given value type
 */
export function getColorForType(value: any) {
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
 */
export function getTypeString(value: any): string {
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
 */
export function printJSONStructure(obj: any, indent = 0, colorFormat: 'html' | 'ansi' = 'ansi') {
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
            result += pad + "  " + printJSONStructure(obj[0], indent + 1, colorFormat);
            result += ",";
            result += "\n";
        } else {
            obj.forEach((item, idx) => {
                result += pad + "  " + printJSONStructure(item, indent + 1, colorFormat);
                if (idx < obj.length - 1) result += ",";
                result += "\n";
            });
        }
        result += pad + colors.blue + "]" + colors.reset;
        return result;
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
                printJSONStructure(value, indent + 1, colorFormat);
        }
        // Handle nested arrays recursively
        else if (Array.isArray(value)) {
            result +=
                color +
                key +
                colors.reset +
                ": " +
                printJSONStructure(value, indent + 1, colorFormat);
        }
        // Handle primitive values
        else {
            result += color + key + ": " + getTypeString(value) + colors.reset;
        }
        if (index < keys.length - 1) result += ",";
        result += "\n";
    });
    result += pad + colors.green + "}" + colors.reset;

    return result;
}
