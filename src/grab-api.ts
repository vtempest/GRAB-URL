import {
  printJSONStructure,
  log,
  type LogOptions,
} from "./log-json";

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
export default async function grab<TResponse = any, TParams = any>(
  path: string,
  options?: GrabOptions<TResponse, TParams>
): Promise<GrabResponse<TResponse>> {
  var {
    headers,
    response = {} as any, // Pre-initialized object to set the response in. isLoading and error are also set on this object.
    method = options?.post // set post: true for POST, omit for GET
      ? "POST"
      : options?.put
        ? "PUT"
        : options?.patch
          ? "PATCH"
          : "GET",
    cache = false, // Enable/disable frontend caching
    cacheForTime = 60, // Seconds to consider data stale and invalidate cache
    timeout = 30, // Request timeout in seconds
    baseURL = (typeof process !== "undefined" && process.env.SERVER_API_URL) ||
    "/api/", // Use env var or default to /api/
    cancelOngoingIfNew = false, // Cancel previous request for same path
    cancelNewIfOngoing = false, // Don't make new request if one is ongoing
    rateLimit = 0, // Minimum seconds between requests
    debug = false, // Auto-enable debug on localhost
    // typeof window !== "undefined" && window?.location?.hostname?.includes("localhost"),
    infiniteScroll = null, // page key, response field to concatenate, element with results
    setDefaults = false, // Set these options as defaults for future requests
    retryAttempts = 0, // Retry failed requests once
    logger = log, // Custom logger to override the built-in color JSON log()
    onRequest = null, // Hook to modify request data before request is made
    onResponse = null, // Hook to modify request data after request is made
    onError = null, // Hook to modify request data after request is made
    onStream = null, // Hook to process the response as a stream (i.e., for instant unarchiving)
    repeatEvery = null, // Repeat request every seconds
    repeat = 0, // Repeat request this many times
    debounce = 0, // Seconds to debounce request, wait to execute so that other requests may override
    regrabOnStale = false, // Refetch when cache is past cacheForTime
    regrabOnFocus = false, // Refetch on window refocus
    regrabOnNetwork = false, // Refetch on network change
    post = false,
    put = false,
    patch = false,
    body = null,
    ...params  // All other params become request params/query
  } = {
    // Destructure options with defaults, merging with any globally set defaults
    ...(typeof window !== "undefined"
      ? window?.grab?.defaults
      : (globalThis)?.grab?.defaults || {}),
    ...options,
  };

  // Handle URL construction
  // Ensures proper joining of baseURL and path
  let s = (t) => path.startsWith(t);
  if (s("http:") || s("https:")) baseURL = "";
  else if (!s("/") && !baseURL.endsWith("/")) path = "/" + path;
  else if (s("/") && baseURL.endsWith("/")) path = path.slice(1);

  try {
    //handle debounce
    if (debounce > 0)
      return (await debouncer(async () => {
        await grab(path, { ...options, debounce: 0 });
      }, debounce * 1000)) as GrabResponse;

    // Handle repeat options:
    // - repeat: Makes the same request multiple times sequentially
    // - repeatEvery: Makes the request periodically on an interval
    if (repeat > 1) {
      for (let i = 0; i < repeat; i++) {
        await grab(path, { ...options, repeat: 0 });
      }
      return response;
    }
    if (repeatEvery) {
      setInterval(async () => {
        await grab(path, { ...options, repeat: 0, repeatEvery: null });
      }, repeatEvery * 1000);
      return response;
    }

    // Store the provided options as new defaults if setDefaults flag is set
    // This allows configuring default options that apply to all future requests
    if (options?.setDefaults) {
      if (typeof window !== "undefined")
        window.grab.defaults = { ...options, setDefaults: undefined };
      else if (typeof globalThis.grab !== "undefined")
        globalThis.grab.defaults = {
          ...options,
          setDefaults: undefined,
        };

      return;
    }

    // regrab on stale, on window refocus, on network
    if (typeof window !== "undefined") {
      const regrab = async () => await grab(path, { ...options, cache: false });
      if (regrabOnStale && cache) setTimeout(regrab, 1000 * cacheForTime);
      if (regrabOnNetwork) window.addEventListener("online", regrab);
      if (regrabOnFocus) {
        window.addEventListener("focus", regrab);
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "visible") await regrab();
        });
      }
    }

    // Handle response parameter which can be either an object to populate
    // or a function to call with results (e.g. React setState)
    let resFunction = typeof response === "function" ? response : null;
    if (!response || resFunction) response = {};

    var [paginateKey, paginateResult, paginateElement] = infiniteScroll || [];

    // Configure infinite scroll behavior if enabled
    // Attaches scroll listener to specified element that triggers next page load
    if (infiniteScroll?.length && typeof paginateElement !== "undefined"
      && typeof window !== "undefined") {
      let paginateDOM =
        typeof paginateElement === "string"
          ? document.querySelector(paginateElement)
          : paginateElement;

      if (!paginateDOM) log("paginateDOM not found", { color: "red" });
      else if (window.scrollListener
        && typeof paginateDOM !== "undefined"
        && typeof paginateDOM.removeEventListener === "function")
        paginateDOM.removeEventListener("scroll", window.scrollListener);

      // Your modified scroll listener with position saving
      window.scrollListener = async (event) => {
        const t = event.target as HTMLElement;

        // Save scroll position whenever user scrolls
        localStorage.setItem(
          "scroll",
          JSON.stringify([t.scrollTop, t.scrollLeft, paginateElement])
        );

        if (t.scrollHeight - t.scrollTop <= t.clientHeight + 200) {
          await grab(path, {
            ...options,
            cache: false,
            [paginateKey]: priorRequest?.currentPage + 1,
          });
        }
      };

      if (paginateDOM)
        paginateDOM.addEventListener("scroll", window.scrollListener);
    }

    // Check request history for a previous request with same path/params
    // Used for caching and pagination. Ignores pagination params when comparing.
    let paramsAsText = JSON.stringify(
      paginateKey ? { ...params, [paginateKey]: undefined } : params
    );
    let priorRequest = grab?.log?.find(
      (e) => e.request == paramsAsText && e.path == path
    );

    // Handle response data management based on pagination settings
    if (!paginateKey) {
      // Clear any existing response data
      for (let key of Object.keys(response)) response[key] = undefined;

      // For non-paginated requests:
      // Return cached response if caching enabled and identical request exists
      // after returning cache, proceed with call to revalidate ensure data is up to date
      if (
        cache &&
        (!cacheForTime ||
          priorRequest?.lastFetchTime > Date.now() - 1000 * cacheForTime)
      ) {
        // set response to cache data
        for (let key of Object.keys(priorRequest.res))
          response[key] = priorRequest.res[key];
        if (resFunction) response = resFunction(response);

        // if (!cacheValidate)  return response;
      }
    } else {
      // For paginated requests:
      // Track current page number and append results to existing data
      let pageNumber =
        priorRequest?.currentPage + 1 || params?.[paginateKey] || 1;

      // Clear response if this is a new request with new params
      if (!priorRequest) {
        response[paginateResult] = [];
        pageNumber = 1;
      }

      // Update page tracking
      if (priorRequest) priorRequest.currentPage = pageNumber;
      params = { ...params, [paginateKey]: pageNumber };
    }

    // Set loading state on response object
    if (resFunction) resFunction({ isLoading: true });
    else if (typeof response === "object") response.isLoading = true;

    if (resFunction) response = resFunction(response);

    // Enforce rate limiting between requests if configured
    if (
      rateLimit > 0 &&
      priorRequest?.lastFetchTime &&
      priorRequest.lastFetchTime > Date.now() - 1000 * rateLimit
    )
      throw new Error(`Fetch rate limit exceeded for ${path}. 
        Wait ${rateLimit}s between requests.`);

    // Handle request cancellation based on configuration:
    // - cancelOngoingIfNew: Cancels any in-progress request for same path
    // - cancelNewIfOngoing: Prevents new request if one is already in progress
    if (priorRequest?.controller)
      if (cancelOngoingIfNew) priorRequest.controller.abort();
      else if (cancelNewIfOngoing) return { isLoading: true } as GrabResponse;

    // Track new request in history log
    if (typeof grab.log != "undefined")
      grab.log?.unshift({
        path,
        request: paramsAsText,
        lastFetchTime: Date.now(),
        controller: new AbortController(),
      });

    // Configure fetch request parameters including headers, cache settings,
    // and timeout/cancellation signals
    let fetchParams = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: params.body,
      redirect: "follow" as RequestRedirect,
      cache: cache ? "force-cache" : ("no-store" as RequestCache),
      signal: cancelOngoingIfNew
        ? grab.log[0]?.controller?.signal
        : AbortSignal.timeout(timeout * 1000),
    } as RequestInit;

    // Format request parameters based on HTTP method
    // POST/PUT/PATCH send data in request body
    // GET/DELETE append data as URL query parameters
    let paramsGETRequest = "";
    if (["POST", "PUT", "PATCH"].includes(method))
      fetchParams.body = params.body || JSON.stringify(params);
    else
      paramsGETRequest =
        (Object.keys(params).length ? "?" : "") +
        new URLSearchParams(params).toString();

    // Execute pre-request hook if configured
    // Allows modifying request data before sending
    if (typeof onRequest === "function")
      [path, response, params, fetchParams] = onRequest(
        path,
        response,
        params,
        fetchParams
      );

    // Process request through mock handler if configured
    // Otherwise make actual API request
    let res = null,
      startTime = new Date(),
      mockHandler = grab.mock?.[path] as GrabMockHandler;

    let wait = (s) => new Promise((res) => setTimeout(res, s * 1000 || 0));

    if (
      mockHandler &&
      (!mockHandler.params || mockHandler.method == method) &&
      (!mockHandler.params ||
        paramsAsText == JSON.stringify(mockHandler.params))
    ) {
      await wait(mockHandler.delay);

      res =
        typeof mockHandler.response === "function"
          ? mockHandler.response(params)
          : mockHandler.response;
    } else {
      // Make actual API request and handle response based on content type
      res = await fetch(baseURL + path + paramsGETRequest, fetchParams).catch(
        (e) => {
          throw new Error(e.message);
        }
      );

      if (!res.ok)
        throw new Error(`HTTP error: ${res.status} ${res.statusText}`);

      // Convert browser ReadableStream to Node.js stream
      let type = res.headers.get("content-type");

      if (onStream) await onStream(res.body);
      else
        res = await (type
          ? type.includes("application/json")
            ? res && res.json()
            : type.includes("application/pdf") ||
              type.includes("application/octet-stream")
              ? res.blob()
              : res.text()
          : res.json()
        ).catch((e) => {
          throw new Error("Error parsing response: " + e);
        });
    }

    // Execute post-request hook if configured
    // Allows modifying response data before processing
    if (typeof onResponse === "function")
      [path, response, params, fetchParams] = onResponse(
        path,
        response,
        params,
        fetchParams
      );

    // Clear request tracking states
    if (resFunction) resFunction({ isLoading: undefined });
    else if (typeof response === "object") delete response?.isLoading;

    delete priorRequest?.controller;

    // Log debug information if enabled
    // Includes request details, timing, and response structure
    const elapsedTime = (
      (Number(new Date()) - Number(startTime)) /
      1000
    ).toFixed(1);
    if (debug) {
      logger(
        "Path:" +
        baseURL +
        path +
        paramsGETRequest +
        "\n" +
        JSON.stringify(options, null, 2) +
        "\nTime: " +
        elapsedTime +
        "s\nResponse: " +
        printJSONStructure(res)
      );
      // console.log(res);
    }

    // if (typeof res === "undefined") return;

    // Update response object with results
    // For paginated requests, concatenates with existing results
    if (typeof res === "object") {
      for (let key of Object.keys(res))
        response[key] =
          paginateResult == key && response[key]?.length
            ? [...response[key], ...res[key]]
            : res[key];

      if (typeof response !== "undefined") response.data = res; // for axios compat
    } else if (resFunction) resFunction({ data: res, ...res });
    else if (typeof response === "object") response.data = res;

    // Store request/response in history log
    if (typeof grab.log != "undefined")
      grab.log?.unshift({
        path,
        request: JSON.stringify({ ...params, paginateKey: undefined }),
        response,
        lastFetchTime: Date.now(),
      });

    if (resFunction) response = resFunction(response);

    return response;
  } catch (error) {
    // Handle any errors that occurred during request processing
    let errorMessage =
      "Error: " + error.message + "\nPath:" + baseURL + path + "\n";
    // JSON.stringify(params);

    // if onError hook is passed
    if (typeof onError === "function")
      onError(error.message, baseURL + path, params);

    // Retry request if retries are configured and attempts remain
    if (options.retryAttempts > 0)
      return await grab(path, {
        ...options,
        retryAttempts: --options.retryAttempts,
      });

    // Update error state in response object
    // Do not show errors for duplicate aborted requests
    if (!error.message.includes("signal") && options.debug) {
      logger(errorMessage, { color: "red" });
      if (debug && typeof document !== "undefined") showAlert(errorMessage);
    }
    response.error = error.message;
    if (typeof response === "function") {
      response.data = response({ isLoading: undefined, error: error.message });
      response = response.data;
    } else delete response?.isLoading;

    // Log error in request history
    if (typeof grab.log != "undefined")
      grab.log?.unshift({
        path,
        request: JSON.stringify(params),
        error: error.message,
      });

    // if (typeof options.response === "function")
    //   response = options.response(response);
    return response;
  }
}

/**
 * Creates a new instance of grab with default options
 * to apply to all requests made by this instance
 * @param {Object} defaults - options for all requests by instance
 * @returns {Function} grab() function using those options
 */
grab.instance =
  (defaults = {}) =>
    (path, options = {}) =>
      grab(path, { ...defaults, ...options });

// delays execution so that future calls may override and only executes last one
const debouncer = async (func, wait) => {
  let timeout;
  return async function executedFunction(...args) {
    const later = async () => {
      clearTimeout(timeout);
      await func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Add globals to window in browser, or global in Node.js
if (typeof window !== "undefined") {
  window.log = log;
  window.grab = grab;

  window.grab.log = [];
  window.grab.mock = {};
  window.grab.defaults = {};

  //Ctrl+I setup dev tools
  setupDevTools();

  // Restore scroll position when page loads or component mounts
  document.addEventListener("DOMContentLoaded", () => {
    let [scrollTop, scrollLeft, paginateElement] =
      JSON.parse(localStorage.getItem("scroll")) || [];
    if (!scrollTop) return;
    document.querySelector(paginateElement).scrollTop = scrollTop;
    document.querySelector(paginateElement).scrollLeft = scrollLeft;
  });
} else if (typeof globalThis !== "undefined") {
  grab.log = [];
  grab.mock = {};
  grab.defaults = {};
  globalThis.log = log;
  globalThis.grab = grab.instance();
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
 * Adds a keyboard shortcut (Ctrl+Alt+I) that shows a modal with request history
 * Each request entry shows:
 * - Request path
 * - Request details
 * - Response data
 * - Timestamp
 */
export function setupDevTools() {
  // Keyboard shortcut (Ctrl+Alt+I) to toggle debug view
  document.addEventListener("keydown", (e) => {
    if (e.key === "i" && e.ctrlKey && e.altKey) {
      // Create HTML of the grab.log requests
      let html = " ";
      for (let request of grab.log) {
        html += `<div style="margin-bottom:1em; border-bottom:1px solid #ccc; padding-bottom:1em;">
          <b>Path:</b> ${request.path}<br>
          <b>Request:</b> ${printJSONStructure(request.request, 0, 'html')}<br>
          <b>Response:</b> ${printJSONStructure(request.response, 0, 'html')}<br> 
          <b>Time:</b> ${new Date(request.lastFetchTime).toLocaleString()}
        </div>`;
      }
      showAlert(html);
    }
  });
}



/***************** TYPESCRIPT INTERFACES *****************/

// Core response object that gets populated with API response data
export type GrabResponse<TResponse = any> = TResponse & {
  /** Indicates if request is currently in progress */
  isLoading?: boolean;
  /** Error message if request failed */
  error?: string;
  /** Binary or text response data (JSON is set to the root)*/
  data?: TResponse | any;
  /** The actual response data - type depends on API endpoint */
  [key: string]: unknown;
};

export type GrabOptions<TResponse = any, TParams = any> = TParams & {
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

// Combined options and parameters interface

// Mock server configuration for testing
export interface GrabMockHandler<TParams = any, TResponse = any> {
  /** Mock response data or function that returns response */
  response: TResponse | ((params: TParams) => TResponse);
  /** HTTP method this mock should respond to */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
  /** Request parameters this mock should match */
  params?: TParams;
  /** Delay in seconds before returning mock response */
  delay?: number;
}

// Request log entry for debugging and history
export interface GrabLogEntry {
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

// Global grab configuration and state
export interface GrabGlobal {
  /** Default options applied to all requests */
  defaults?: Partial<GrabOptions>;
  /** Request history and debugging info */
  log?: GrabLogEntry[];
  /** Mock server handlers for testing */
  mock?: Record<string, GrabMockHandler>;
  /** Create a separate instance of grab with separate default options */
  instance?: (defaultOptions?: Partial<GrabOptions>) => GrabFunction;
}

// Main grab function signature with overloads for different use cases
export interface GrabFunction {
  /**
   * ### GRAB: Generate Request to API from Browser
   * ![grabAPILogo](https://i.imgur.com/Rwl5P3p.png)
   * Make API request with path
   * @returns {Promise<Object>} The response object with resulting data or .error if error.
   * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
   * @see  [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org/lib)
   */
  <TResponse = any, TParams = Record<string, any>>(path: string, options?: GrabOptions<TResponse, TParams>): Promise<
    GrabResponse<TResponse>
  >;

  /**
   * ### GRAB: Generate Request to API from Browser
   * ![grabAPILogo](https://i.imgur.com/Rwl5P3p.png)
   * Make API request with path and options/parameters
   * @returns {Promise<Object>} The response object with resulting data or .error if error.
   * @author [vtempest (2025)](https://github.com/vtempest/GRAB-URL)
   * @see  [🎯 Examples](https://grab.js.org/docs/Examples) [📑 Docs](https://grab.js.org/lib)
   */
  <TResponse = any, TParams = Record<string, any>>(
    path: string,
    config: GrabOptions<TResponse, TParams>
  ): Promise<GrabResponse<TResponse>>;

  /** Default options applied to all requests */
  defaults?: Partial<GrabOptions>;

  /** Request history and debugging info for all requests */
  log?: GrabLogEntry[];

  /** Mock server handlers for testing */
  mock?: Record<string, GrabMockHandler>;

  /** Create a separate instance of grab with separate default options */
  instance?: (defaultOptions?: Partial<GrabOptions>) => GrabFunction;
}

// Log function for debugging
export interface LogFunction {
  /**
   * Log messages with custom styling
   * @param message - Message to log (string or object)
   */
  (message: string | object, options?: LogOptions): void;
}

// Utility function to describe JSON structure
export interface printJSONStructureFunction {
  /**
   * Generate TypeDoc-like description of JSON object structure
   * @param obj - The JSON object to describe
   * @returns String representation of object structure
   */
  (obj: any): string;
}

declare global {
  // Browser globals
  interface Window {
    grab: GrabFunction;
    log: LogFunction;
    scrollListener: (event: Event) => void; // replace 'any' with the actual type if you know it (e.g., a function type)
  }

  // Node.js globals
  namespace NodeJS {
    interface Global {
      grab: GrabFunction;
      log: LogFunction;
    }
  }

  // Global variables available after script inclusion
  var log: LogFunction;
  var grab: GrabFunction;
}

export { grab, log, printJSONStructure };
