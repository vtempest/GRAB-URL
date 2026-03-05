/**
 * Normalizes and builds a URL from a base and relative path.
 *
 * @param baseURL - The base API URL.
 * @param path - The specific endpoint path.
 * @returns An object containing the combined URL and updated baseURL/path if needed.
 */
export declare const buildUrl: (baseURL: string, path: string) => {
    baseURL: string;
    path: string;
};

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
 * Delays execution so that future calls may override and only executes the last one.
 * Useful for search inputs or other high-frequency events.
 *
 * @param func - The function to debounce.
 * @param wait - Time to wait in milliseconds.
 * @returns A debounced version of the function.
 */
export declare const debouncer: (func: Function, wait: number) => Promise<(...args: any[]) => Promise<void>>;

declare const grab_2: GrabFunction;
export default grab_2;
export { grab_2 as grab }

/**
 * Main grab function signature with overloads for different use cases.
 */
export declare interface GrabFunction {
    /**
     * ### GRAB: Generate Request to API from Browser
     * ![grabAPILogo](https://i.imgur.com/Rwl5P3p.png)
     * Make API request with path
     * @template TResponse The expected shape of the response data.
     * @template TParams The shape of the request parameters.
     * @param path The full URL path OR relative path on this server
     * @param options Request params and utility options
     * @returns {Promise<Object>} The response object with resulting data or .error if error.
     * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
     * @see  [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org/lib)
     */
    <TResponse = any, TParams = Record<string, any>>(path: string, options?: GrabOptions<TResponse, TParams>): Promise<GrabResponse<TResponse>>;
    /**
     * ### GRAB: Generate Request to API from Browser
     * ![grabAPILogo](https://i.imgur.com/Rwl5P3p.png)
     * Make API request with path and options/parameters
     * @template TResponse The expected shape of the response data.
     * @template TParams The shape of the request parameters.
     * @param path The full URL path OR relative path on this server
     * @param config Request configuration and utility options
     * @returns {Promise<Object>} The response object with resulting data or .error if error.
     * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
     * @see  [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org/lib)
     */
    <TResponse = any, TParams = Record<string, any>>(path: string, config: GrabOptions<TResponse, TParams>): Promise<GrabResponse<TResponse>>;
    /** Default options applied to all requests */
    defaults: Partial<GrabOptions>;
    /** Request history and debugging info for all requests */
    log: GrabLogEntry[];
    /** Mock server handlers for testing */
    mock: Record<string, GrabMockHandler>;
    /** Create a separate instance of grab with separate default options */
    instance: (defaultOptions?: Partial<GrabOptions>) => GrabFunction;
}

/**
 * Global grab configuration and state.
 */
export declare interface GrabGlobal {
    /** Default options applied to all requests */
    defaults: Partial<GrabOptions>;
    /** Request history and debugging info */
    log: GrabLogEntry[];
    /** Mock server handlers for testing */
    mock: Record<string, GrabMockHandler>;
    /** Create a separate instance of grab with separate default options */
    instance: (defaultOptions?: Partial<GrabOptions>) => GrabFunction;
}

/**
 * Request log entry for debugging and history.
 */
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

/**
 * Mock server configuration for testing.
 * @template TParams The shape of the request parameters.
 * @template TResponse The shape of the mock response data.
 */
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

/**
 * Configuration options for the grab request.
 * @template TResponse The expected shape of the response data.
 * @template TParams The shape of the request parameters.
 */
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

/**
 * Core response object that gets populated with API response data.
 * @template TResponse The expected shape of the response data.
 */
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
 */
export declare function log(message?: string | object, options?: LogOptions): boolean;

/**
 * Log function for debugging.
 */
export declare interface LogFunction {
    /**
     * Log messages with custom styling
     * @param message - Message to log (string or object)
     * @param options - Styling and control options
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
 * Utility function to describe JSON structure.
 */
export declare interface printJSONStructureFunction {
    /**
     * Generate TypeDoc-like description of JSON object structure
     * @param obj - The JSON object to describe
     * @returns String representation of object structure
     */
    (obj: any): string;
}

/**
 * Sets up development tools for debugging API requests.
 * Adds a keyboard shortcut (Ctrl+Alt+I) to toggle a modal showing the request history from `grab.log`.
 */
export declare function setupDevTools(): void;

/**
 * @file ui/devtools.ts
 * @description Visual development tools for the Grab API.
 * Includes a modal overlay for inspect request history (Ctrl+Alt+I).
 */
/**
 * Shows a message in a modal overlay with a scrollable message stack.
 * Easier to dismiss than native alert() and does not block window execution.
 *
 * @param msg - The message or HTML content to display.
 */
export declare function showAlert(msg: string): void;

/**
 * Helper function to wait for a specified number of seconds.
 *
 * @param s - Seconds to wait.
 * @returns A promise that resolves after the timeout.
 */
export declare const wait: (s: number) => Promise<unknown>;

export { }
