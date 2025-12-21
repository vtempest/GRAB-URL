/**
 * Available color formats
 */
export declare enum ColorFormat {
    ANSI = "ansi",
    HTML = "html",
    AUTO = "auto"
}

/**
 * Available color names
 */
export declare enum ColorName {
    RESET = "reset",
    BLACK = "black",
    RED = "red",
    GREEN = "green",
    YELLOW = "yellow",
    BLUE = "blue",
    MAGENTA = "magenta",
    CYAN = "cyan",
    WHITE = "white",
    GRAY = "gray",
    BRIGHT_RED = "brightRed",
    BRIGHT_GREEN = "brightGreen",
    BRIGHT_YELLOW = "brightYellow",
    BRIGHT_BLUE = "brightBlue",
    BRIGHT_MAGENTA = "brightMagenta",
    BRIGHT_CYAN = "brightCyan",
    BRIGHT_WHITE = "brightWhite",
    BG_RED = "bgRed",
    BG_GREEN = "bgGreen",
    BG_YELLOW = "bgYellow",
    BG_BLUE = "bgBlue",
    BG_MAGENTA = "bgMagenta",
    BG_CYAN = "bgCyan",
    BG_WHITE = "bgWhite",
    BG_GRAY = "bgGray",
    BG_BLACK = "bgBlack"
}

/**
 * Returns color codes based on the specified format
 * @param format - Output format for colors
 *   - 'ansi': Returns ANSI escape codes (e.g., '\x1b[31m')
 *   - 'html': Returns HTML hex colors (e.g., '#ff0000')
 *   - 'auto': Auto-detects environment (HTML for browser, ANSI for Node.js)
 * @returns Object with color names as keys and color codes as values
 */
export declare function getColors(format?: ColorFormat): Record<ColorName, string>;

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
export declare function log(message?: string | object, options?: LogOptions): boolean;

export declare interface LogOptions {
    /** CSS style string or array of CSS strings for browser console styling */
    style?: string | string[];
    /** Optional color name or code for terminal environments */
    color?: ColorName | string | null;
    /** If true, hides log in production (auto-detects by hostname if undefined) */
    hideInProduction?: boolean;
    /** Start a spinner (for CLI tools, optional) */
    startSpinner?: boolean;
    /** Stop a spinner (for CLI tools, optional) */
    stopSpinner?: boolean;
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
export declare function printJSONStructure(obj: any, indent?: number, colorFormat?: ColorFormat): string;

/**
 * Sets up development tools for debugging API requests
 * Adds a keyboard shortcut (Ctrl+Alt+I) that shows a modal with request history
 * Each request entry shows:
 * - Request path
 * - Request details
 * - Response data
 * - Timestamp
 */
export declare function setupDevTools(): void;

/**
 * Shows message in a modal overlay with scrollable message stack
 * and is easier to dismiss unlike alert() which blocks window.
 * Creates a semi-transparent overlay with a white box containing the message.
 * @param {string} msg - The message to display
 */
export declare function showAlert(msg: any): void;

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
export declare function showSpinnerInTerminal(text: any): (success?: string) => void;

export { }
