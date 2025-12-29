/**
 * Available color names
 */
declare enum ColorName {
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
    BG_BLACK = "bgBlack",
    BG_BRIGHT_RED = "bgBrightRed",
    BG_BRIGHT_GREEN = "bgBrightGreen",
    BG_BRIGHT_YELLOW = "bgBrightYellow",
    BG_BRIGHT_BLUE = "bgBrightBlue",
    BG_BRIGHT_MAGENTA = "bgBrightMagenta",
    BG_BRIGHT_CYAN = "bgBrightCyan",
    BG_BRIGHT_WHITE = "bgBrightWhite"
}

/**
 * ### GRAB: Generate Request to API from Browser
 * ![GrabAPILogo](https://i.imgur.com/Rwl5P3p.png)
 *
 * 1. **GRAB is the FBEST Request Manager: Functionally Brilliant, Elegantly Simple Tool**: One Function, no dependencies,
 *    minimalist syntax, [more features than alternatives](https://grab.js.org/docs/Comparisons)
 * 2. **Auto-JSON Convert**: Pass parameters and get response or error in JSON, handling other data types as is.
 * 3. **isLoading Status**: Sets `.isLoading=true` on the pre-initialized response object so you can show a "Loading..." in any framework
 * 4. **Debug Logging**: Adds global `log()` and prints colored JSON structure, response, timing for requests in test.
 * 5. **Mock Server Support**: Configure `window.grab.mock` for development and testing environments
 * 6. **Cancel Duplicates**: Prevent this request if one is ongoing to same path & params, or cancel the ongoing request.
 * 7. **Timeout & Retry**: Customizable request timeout, default 30s, and auto-retry on error
 * 8. **DevTools**: `Ctrl+I` overlays webpage with devtools showing all requests and responses, timing, and JSON structure.
 * 9. **Request History**: Stores all request and response data in global `grab.log` object
 * 10. **Pagination Infinite Scroll**: Built-in pagination for infinite scroll to auto-load and merge next result page, with scroll position recovery.
 * 11. **Base URL Based on Environment**: Configure `grab.defaults.baseURL` once at the top, overide with `SERVER_API_URL` in `.env`.
 * 12. **Frontend Cache**: Set cache headers and retrieve from frontend memory for repeat requests to static data.
 * 13. **Regrab On Error**: Regrab on timeout error, or on window refocus, or on network change, or on stale data.
 * 14. **Framework Agnostic**: Alternatives like TanStack work only in component initialization and depend on React & others.
 * 15. **Globals**: Adds to window in browser or global in Node.js so you only import once: `grab()`, `log()`, `grab.log`, `grab.mock`, `grab.defaults`
 * 16. **TypeScript Tooltips**: Developers can hover over option names and autocomplete TypeScript.
 * 17. **Request Stategies**: [🎯 Examples](https://grab.js.org/docs/Examples) show common stategies like debounce, repeat, proxy, unit tests, interceptors, file upload, etc
 * 18. **Rate Limiting**: Built-in rate limiting to prevent multi-click cascading responses, require to wait seconds between requests.
 * 19. **Repeat**: Repeat request this many times, or repeat every X seconds to poll for updates.
 * 20. **Loading Icons**: Import from `grab-url/icons` to get enhanced animated loading icons.
 *
 * @param {string} path The full URL path OR relative path on this server after `grab.defaults.baseURL`
 * @param {object} [options={}] Request params for GET or body for POST/PUT/PATCH and utility options
 * @param {string} [options.method] default="GET" The HTTP method to use
 * @param {object} [options.response] Pre-initialized object which becomes response JSON, no need for `.data`.
 *  isLoading and error may also be set on this object. May omit and use return if load status is not needed.
 * @param {boolean} [options.cancelOngoingIfNew]  default=false Cancel previous requests to same path
 * @param {boolean} [options.cancelNewIfOngoing] default=false Cancel if a request to path is in progress
 * @param {boolean} [options.cache] default=false Whether to cache the request and from frontend cache
 * @param {boolean} [options.debug] default=false Whether to log the request and response
 * @param {number} [options.timeout] default=30 The timeout for the request in seconds
 * @param {number} [options.cacheForTime] default=60 Seconds to consider data stale and invalidate cache
 * @param {number} [options.rateLimit] default=0 If set, how many seconds to wait between requests
 * @param {string} [options.baseURL] default='/api/' base url prefix, override with SERVER_API_URL env
 * @param {boolean} [options.setDefaults] default=false Pass this with options to set
 *  those options as defaults for all requests.
 * @param {number} [options.retryAttempts] default=0 Retry failed requests this many times
 * @param {array} [options.infiniteScroll] default=null [page key, response field to concatenate, element with results]
 * @param {number} [options.repeat] default=0 Repeat request this many times
 * @param {number} [options.repeatEvery] default=null Repeat request every seconds
 * @param {function} [options.logger] default=log Custom logger to override the built-in color JSON log()
 * @param {function} [options.onRequest] Set with defaults to modify each request data.
 *  Takes and returns in order: path, response, params, fetchParams
 * @param {function} [options.onResponse] Set with defaults to modify each request data.
 *  Takes and returns in order: path, response, params, fetchParams
 * @param {function} [options.onStream] Set with defaults to process the response as a stream (i.e., for instant unzip)
 * @param {function} [options.onError] Set with defaults to modify the error data. Takes: error, path, params
 * @param {number} [options.debounce] default=0 Seconds to debounce request, wait to execute so that other requests may override
 * @param {boolean} [options.regrabOnStale] default=false Refetch when cache is past cacheForTime
 * @param {boolean} [options.regrabOnFocus] default=false Refetch on window refocus
 * @param {boolean} [options.regrabOnNetwork] default=false Refetch on network change
 * @param {any} [...params] All other params become GET params, POST body, and other methods.
 * @returns {Promise<Object>} The response object with resulting data or .error if error.
 * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
 * @see [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org)
 */
declare function grab_2<TResponse = any, TParams = any>(path: string, options?: GrabOptions<TResponse, TParams>): Promise<GrabResponse<TResponse>>;

declare namespace grab_2 {
    var instance: (defaults?: {}) => (path: any, options?: {}) => Promise<any>;
    var log: any[];
    var mock: {};
    var defaults: {};
}
export default grab_2;
export { grab_2 as grab }

export declare interface GrabFunction {
    /**
     * ### GRAB: Generate Request to API from Browser
     * ![grabAPILogo](https://i.imgur.com/Rwl5P3p.png)
     * Make API request with path
     * @returns {Promise<Object>} The response object with resulting data or .error if error.
     * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
     * @see  [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org/lib)
     */
    <TResponse = any, TParams = Record<string, any>>(path: string, options?: GrabOptions<TResponse, TParams>): Promise<GrabResponse<TResponse>>;
    /**
     * ### GRAB: Generate Request to API from Browser
     * ![grabAPILogo](https://i.imgur.com/Rwl5P3p.png)
     * Make API request with path and options/parameters
     * @returns {Promise<Object>} The response object with resulting data or .error if error.
     * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
     * @see  [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org/lib)
     */
    <TResponse = any, TParams = Record<string, any>>(path: string, config: GrabOptions<TResponse, TParams>): Promise<GrabResponse<TResponse>>;
    /** Default options applied to all requests */
    defaults?: Partial<GrabOptions>;
    /** Request history and debugging info for all requests */
    log?: GrabLogEntry[];
    /** Mock server handlers for testing */
    mock?: Record<string, GrabMockHandler>;
    /** Create a separate instance of grab with separate default options */
    instance?: (defaultOptions?: Partial<GrabOptions>) => GrabFunction;
}

export declare interface GrabGlobal {
    /** Default options applied to all requests */
    defaults?: Partial<GrabOptions>;
    /** Request history and debugging info */
    log?: GrabLogEntry[];
    /** Mock server handlers for testing */
    mock?: Record<string, GrabMockHandler>;
    /** Create a separate instance of grab with separate default options */
    instance?: (defaultOptions?: Partial<GrabOptions>) => GrabFunction;
}

export declare interface GrabLogEntry {
    /** API path that was requested */
    path: string;
    /** Stringified request parameters */
    request: string;
    /** Response data (only present for successful requests) */
    response?: any;
    /** Error message (only present for failed requests) */
    error?: string;
    /** Timestamp when request was made */
    lastFetchTime: number;
    /** Abort controller for request cancellation */
    controller?: AbortController;
    /** Current page number for paginated requests */
    currentPage?: number;
}

export declare interface GrabMockHandler<TParams = any, TResponse = any> {
    /** Mock response data or function that returns response */
    response: TResponse | ((params: TParams) => TResponse);
    /** HTTP method this mock should respond to */
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
    /** Request parameters this mock should match */
    params?: TParams;
    /** Delay in seconds before returning mock response */
    delay?: number;
}

export declare type GrabOptions<TResponse = any, TParams = any> = TParams & {
    /** include headers and authorization in the request */
    headers?: Record<string, string>;
    /** Pre-initialized object which becomes response JSON, no need for .data */
    response?: TResponse | ((params: TParams) => TResponse) | any;
    /** default="GET" The HTTP method to use */
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
    /** default=false Whether to cache the request and from frontend cache */
    cache?: boolean;
    /** default=60 Seconds to consider data stale and invalidate cache */
    cacheForTime?: number;
    /** default=30 The timeout for the request in seconds */
    timeout?: number;
    /** default='/api/' base url prefix, override with SERVER_API_URL env */
    baseURL?: string;
    /** default=true Cancel previous requests to same path */
    cancelOngoingIfNew?: boolean;
    /** default=false Cancel if a request to path is in progress */
    cancelNewIfOngoing?: boolean;
    /** default=false If set, how many seconds to wait between requests */
    rateLimit?: number;
    /** default=false Whether to log the request and response */
    debug?: boolean;
    /** default=null [page key, response field to concatenate, element with results] */
    infiniteScroll?: [string, string, string | HTMLElement];
    /** default=false Pass this with options to set those options as defaults for all requests */
    setDefaults?: boolean;
    /** default=0 Retry failed requests this many times */
    retryAttempts?: number;
    /** default=log Custom logger to override the built-in color JSON log() */
    logger?: (...args: any[]) => void;
    /** Set with defaults to modify each request data. Takes and returns in order: path, response, params, fetchParams */
    onRequest?: (...args: any[]) => any;
    /** Set with defaults to modify each request data. Takes and returns in order: path, response, params, fetchParams */
    onResponse?: (...args: any[]) => any;
    /** Set with defaults to modify each request data. Takes and returns in order: error, path, params */
    onError?: (...args: any[]) => any;
    /** Set with defaults to process the response as a stream (i.e., for instant unzip) */
    onStream?: (...args: any[]) => any;
    /** default=0 Repeat request this many times */
    repeat?: number;
    /** default=null Repeat request every seconds */
    repeatEvery?: number;
    /** default=0 Seconds to debounce request, wait to execute so that other requests may override */
    debounce?: number;
    /** default=false Refetch when cache is past cacheForTime */
    regrabOnStale?: boolean;
    /** default=false Refetch on window refocus */
    regrabOnFocus?: boolean;
    /** default=false Refetch on network change */
    regrabOnNetwork?: boolean;
    /** shortcut for method: "POST" */
    post?: boolean;
    /** shortcut for method: "PUT" */
    put?: boolean;
    /** shortcut for method: "PATCH" */
    patch?: boolean;
    /** default=null The body of the POST/PUT/PATCH request (can be passed into main)*/
    body?: any;
    /** All other params become GET params, POST body, and other methods */
    [key: string]: TParams | any;
};

/***************** TYPESCRIPT INTERFACES *****************/
export declare type GrabResponse<TResponse = any> = TResponse & {
    /** Indicates if request is currently in progress */
    isLoading?: boolean;
    /** Error message if request failed */
    error?: string;
    /** Binary or text response data (JSON is set to the root)*/
    data?: TResponse | any;
    /** The actual response data - type depends on API endpoint */
    [key: string]: unknown;
};

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
declare function log_2(message?: string | object, options?: LogOptions): boolean;
export { log_2 as log }

export declare interface LogFunction {
    /**
     * Log messages with custom styling
     * @param message - Message to log (string or object)
     */
    (message: string | object, options?: LogOptions): void;
}

declare interface LogOptions {
    /** CSS style string or array of CSS strings for browser console styling */
    style?: string | string[];
    /** Optional color name or code for terminal environments */
    color?: ColorName | ColorName[] | string | string[];
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
export declare function printJSONStructure(obj: any, indent?: number, colorFormat?: 'html' | 'ansi'): string;

export declare interface printJSONStructureFunction {
    /**
     * Generate TypeDoc-like description of JSON object structure
     * @param obj - The JSON object to describe
     * @returns String representation of object structure
     */
    (obj: any): string;
}

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

export { }
