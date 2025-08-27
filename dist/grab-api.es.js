function log(message = "", options = {}) {
  let {
    color = null,
    style = "color: blue; font-size: 11pt;",
    hideInProduction = void 0,
    startSpinner = false,
    stopSpinner = false
  } = options;
  if (typeof hideInProduction === "undefined")
    hideInProduction = typeof window !== "undefined" && (window == null ? void 0 : window.location.hostname.includes("localhost"));
  if (typeof message === "object")
    message = printJSONStructure(message) + "\n\n" + JSON.stringify(message, null, 2);
  if (color && typeof process !== void 0)
    message = (colors[color] || "") + message + colors.reset;
  var i = 0;
  if (startSpinner)
    (global || globalThis).interval = setInterval(() => {
      process.stdout.write(
        (colors[color] || "") + "\r" + "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("")[i = ++i % 10] + " " + message + colors.reset
      );
    }, 50);
  else if (stopSpinner) {
    clearInterval((global || globalThis).interval);
    process.stdout.write(
      "\r" + (message || "✔ Done") + " ".repeat(message.length + 20) + "\n"
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
const colors = {
  reset: "\x1B[0m",
  // Reset to default color
  black: "\x1B[30m",
  red: "\x1B[31m",
  // Functions, errors
  green: "\x1B[32m",
  // Object braces, success
  yellow: "\x1B[33m",
  // Strings, warnings
  blue: "\x1B[34m",
  // Array brackets, info
  magenta: "\x1B[35m",
  // Booleans
  cyan: "\x1B[36m",
  // Numbers
  white: "\x1B[37m",
  // Default color, plain text
  gray: "\x1B[90m",
  // Null, undefined, subtle
  // Bright variants
  brightRed: "\x1B[91m",
  brightGreen: "\x1B[92m",
  brightYellow: "\x1B[93m",
  brightBlue: "\x1B[94m",
  brightMagenta: "\x1B[95m",
  brightCyan: "\x1B[96m",
  brightWhite: "\x1B[97m",
  // Background colors (optional)
  bgRed: "\x1B[41m",
  bgGreen: "\x1B[42m",
  bgYellow: "\x1B[43m",
  bgBlue: "\x1B[44m",
  bgMagenta: "\x1B[45m",
  bgCyan: "\x1B[46m",
  bgWhite: "\x1B[47m",
  bgGray: "\x1B[100m"
};
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
function printJSONStructure(obj, indent = 0) {
  const pad = "  ".repeat(indent);
  if (typeof obj !== "object" || obj === null) {
    const color = getColorForType(obj);
    return color + getTypeString(obj) + colors.reset;
  }
  if (Array.isArray(obj)) {
    let result2 = colors.blue + "[" + colors.reset;
    if (obj.length) result2 += "\n";
    obj.forEach((item, idx) => {
      result2 += pad + "  " + printJSONStructure(item, indent + 1);
      if (idx < obj.length - 1) result2 += ",";
      result2 += "\n";
    });
    result2 += pad + colors.blue + "]" + colors.reset;
    return result2;
  }
  let result = colors.green + "{" + colors.reset;
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
function showAlert(msg) {
  if (typeof document === "undefined") return;
  let o = document.getElementById("alert-overlay"), list;
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
    o.addEventListener("click", (e) => e.target == o && o.remove());
    document.getElementById("close-alert").onclick = () => o.remove();
  }
  list = o.querySelector("#alert-list");
  list.innerHTML += `<div style="border-bottom:1px solid #333; font-size:1.2em;margin:0.5em 0;">${msg}</div>`;
}
function setupDevTools() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "i" && e.ctrlKey) {
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
async function grab$1(path, options) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  let {
    headers,
    response = {},
    // Pre-initialized object to set the response in. isLoading and error are also set on this object.
    method = options.post ? "POST" : options.put ? "PUT" : options.patch ? "PATCH" : "GET",
    cache = false,
    // Enable/disable frontend caching
    cacheForTime = 60,
    // Seconds to consider data stale and invalidate cache
    timeout = 30,
    // Request timeout in seconds
    baseURL = typeof process !== "undefined" && process.env.SERVER_API_URL || "/api/",
    // Use env var or default to /api/
    cancelOngoingIfNew = false,
    // Cancel previous request for same path
    cancelNewIfOngoing = false,
    // Don't make new request if one is ongoing
    rateLimit = 0,
    // Minimum seconds between requests
    debug = false,
    // Auto-enable debug on localhost
    // typeof window !== "undefined" && window?.location?.hostname?.includes("localhost"),
    infiniteScroll = null,
    // page key, response field to concatenate, element with results
    setDefaults = false,
    // Set these options as defaults for future requests
    retryAttempts = 0,
    // Retry failed requests once
    logger = log,
    // Custom logger to override the built-in color JSON log()
    onRequest = null,
    // Hook to modify request data before request is made
    onResponse = null,
    // Hook to modify request data after request is made
    onError = null,
    // Hook to modify request data after request is made
    onStream = null,
    // Hook to process the response as a stream (i.e., for instant unarchiving)
    repeatEvery = null,
    // Repeat request every seconds
    repeat = 0,
    // Repeat request this many times
    debounce = 0,
    // Seconds to debounce request, wait to execute so that other requests may override
    regrabOnStale = false,
    // Refetch when cache is past cacheForTime
    regrabOnFocus = false,
    // Refetch on window refocus
    regrabOnNetwork = false,
    // Refetch on network change
    post = false,
    put = false,
    patch = false,
    body = null,
    ...params
    // All other params become request params/query
  } = {
    // Destructure options with defaults, merging with any globally set defaults
    ...typeof window !== "undefined" ? (_a = window == null ? void 0 : window.grab) == null ? void 0 : _a.defaults : ((_c = (_b = global || globalThis) == null ? void 0 : _b.grab) == null ? void 0 : _c.defaults) || {},
    ...options
  };
  let s = (t) => path.startsWith(t);
  if (s("http:") || s("https:")) baseURL = "";
  else if (!s("/") && !baseURL.endsWith("/")) path = "/" + path;
  else if (s("/") && baseURL.endsWith("/")) path = path.slice(1);
  try {
    if (debounce > 0)
      return await debouncer(async () => {
        await grab$1(path, { ...options, debounce: 0 });
      }, debounce * 1e3);
    if (repeat > 1) {
      for (let i = 0; i < repeat; i++) {
        await grab$1(path, { ...options, repeat: 0 });
      }
      return response;
    }
    if (repeatEvery) {
      setInterval(async () => {
        await grab$1(path, { ...options, repeat: 0, repeatEvery: null });
      }, repeatEvery * 1e3);
      return response;
    }
    if (options == null ? void 0 : options.setDefaults) {
      if (typeof window !== "undefined")
        window.grab.defaults = { ...options, setDefaults: void 0 };
      else if (typeof (global || globalThis).grab !== "undefined")
        (global || globalThis).grab.defaults = {
          ...options,
          setDefaults: void 0
        };
      return;
    }
    if (typeof window !== void 0) {
      const regrab = async () => await grab$1(path, { ...options, cache: false });
      if (regrabOnStale && cache) setTimeout(regrab, 1e3 * cacheForTime);
      if (regrabOnNetwork) window.addEventListener("online", regrab);
      if (regrabOnFocus) {
        window.addEventListener("focus", regrab);
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "visible") await regrab();
        });
      }
    }
    let resFunction = typeof response === "function" ? response : null;
    if (!response || resFunction) response = {};
    var [paginateKey, paginateResult, paginateElement] = infiniteScroll || [];
    if ((infiniteScroll == null ? void 0 : infiniteScroll.length) && typeof window == "undefined") {
      let paginateDOM = typeof paginateElement === "string" ? document.querySelector(paginateElement) : paginateElement;
      if (paginateDOM)
        paginateDOM.removeEventListener(
          "scroll",
          (_d = window ?? globalThis) == null ? void 0 : _d.scrollListener
        );
      (window ?? globalThis).scrollListener = paginateDOM.addEventListener(
        "scroll",
        async ({ target }) => {
          const t = target;
          localStorage.setItem(
            "scroll",
            JSON.stringify([t.scrollTop, t.scrollLeft, paginateElement])
          );
          if (t.scrollHeight - t.scrollTop <= t.clientHeight + 200) {
            await grab$1(path, {
              ...options,
              cache: false,
              [paginateKey]: (priorRequest == null ? void 0 : priorRequest.currentPage) + 1
            });
          }
        }
      );
    }
    let paramsAsText = JSON.stringify(
      paginateKey ? { ...params, [paginateKey]: void 0 } : params
    );
    let priorRequest = (_e = grab$1 == null ? void 0 : grab$1.log) == null ? void 0 : _e.find(
      (e) => e.request == paramsAsText && e.path == path
    );
    if (!paginateKey) {
      for (let key of Object.keys(response)) response[key] = void 0;
      if (cache && (!cacheForTime || (priorRequest == null ? void 0 : priorRequest.lastFetchTime) > Date.now() - 1e3 * cacheForTime)) {
        for (let key of Object.keys(priorRequest.res))
          response[key] = priorRequest.res[key];
        if (resFunction) response = resFunction(response);
      }
    } else {
      let pageNumber = (priorRequest == null ? void 0 : priorRequest.currentPage) + 1 || (params == null ? void 0 : params[paginateKey]) || 1;
      if (!priorRequest) {
        response[paginateResult] = [];
        pageNumber = 1;
      }
      if (priorRequest) priorRequest.currentPage = pageNumber;
      params[paginateKey] = pageNumber;
    }
    if (resFunction) resFunction({ isLoading: true });
    else if (typeof response === "object") response.isLoading = true;
    if (resFunction) response = resFunction(response);
    if (rateLimit > 0 && (priorRequest == null ? void 0 : priorRequest.lastFetchTime) && priorRequest.lastFetchTime > Date.now() - 1e3 * rateLimit)
      throw new Error(`Fetch rate limit exceeded for ${path}. 
        Wait ${rateLimit}s between requests.`);
    if (priorRequest == null ? void 0 : priorRequest.controller) {
      if (cancelOngoingIfNew) priorRequest.controller.abort();
      else if (cancelNewIfOngoing) return { isLoading: true };
    }
    if (typeof grab$1.log != "undefined")
      (_f = grab$1.log) == null ? void 0 : _f.unshift({
        path,
        request: paramsAsText,
        lastFetchTime: Date.now(),
        controller: new AbortController()
      });
    let fetchParams = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers
      },
      body: params.body,
      redirect: "follow",
      cache: cache ? "force-cache" : "no-store",
      signal: cancelOngoingIfNew ? (_h = (_g = grab$1.log[0]) == null ? void 0 : _g.controller) == null ? void 0 : _h.signal : AbortSignal.timeout(timeout * 1e3)
    };
    let paramsGETRequest = "";
    if (["POST", "PUT", "PATCH"].includes(method))
      fetchParams.body = params.body || JSON.stringify(params);
    else
      paramsGETRequest = (Object.keys(params).length ? "?" : "") + new URLSearchParams(params).toString();
    if (typeof onRequest === "function")
      [path, response, params, fetchParams] = onRequest(
        path,
        response,
        params,
        fetchParams
      );
    let res = null, startTime = /* @__PURE__ */ new Date(), mockHandler = (_i = grab$1.mock) == null ? void 0 : _i[path];
    let wait = (s2) => new Promise((res2) => setTimeout(res2, s2 * 1e3 || 0));
    if (mockHandler && (!mockHandler.params || mockHandler.method == method) && (!mockHandler.params || paramsAsText == JSON.stringify(mockHandler.params))) {
      await wait(mockHandler.delay);
      res = typeof mockHandler.response === "function" ? mockHandler.response(params) : mockHandler.response;
    } else {
      res = await fetch(baseURL + path + paramsGETRequest, fetchParams).catch(
        (e) => {
          throw new Error(e);
        }
      );
      if (!res.ok)
        throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
      let type = res.headers.get("content-type");
      if (onStream) await onStream(res.body);
      else
        res = await (type ? type.includes("application/json") ? res && res.json() : type.includes("application/pdf") || type.includes("application/octet-stream") ? res.blob() : res.text() : res.json()).catch((e) => {
          throw new Error("Error parsing response: " + e);
        });
    }
    if (typeof onResponse === "function")
      [path, response, params, fetchParams] = onResponse(
        path,
        response,
        params,
        fetchParams
      );
    if (resFunction) resFunction({ isLoading: void 0 });
    else if (typeof response === "object") response == null ? true : delete response.isLoading;
    priorRequest == null ? true : delete priorRequest.controller;
    const elapsedTime = ((Number(/* @__PURE__ */ new Date()) - Number(startTime)) / 1e3).toFixed(1);
    if (debug) {
      logger(
        "Path:" + baseURL + path + paramsGETRequest + "\n" + JSON.stringify(options, null, 2) + "\nTime: " + elapsedTime + "s\nResponse: " + printJSONStructure(res)
      );
    }
    if (typeof res === "object") {
      for (let key of Object.keys(res))
        response[key] = paginateResult == key && ((_j = response[key]) == null ? void 0 : _j.length) ? [...response[key], ...res[key]] : res[key];
      if (typeof response !== "undefined") response.data = res;
    } else if (resFunction) resFunction({ data: res, ...res });
    else if (typeof response === "object") response.data = res;
    if (typeof grab$1.log != "undefined")
      (_k = grab$1.log) == null ? void 0 : _k.unshift({
        path,
        request: JSON.stringify({ ...params, paginateKey: void 0 }),
        response,
        lastFetchTime: Date.now()
      });
    if (resFunction) response = resFunction(response);
    return response;
  } catch (error) {
    let errorMessage = "Error: " + error.message + "\nPath:" + baseURL + path + "\n";
    JSON.stringify(params);
    if (typeof onError === "function")
      onError(error.message, baseURL + path, params);
    if (options.retryAttempts > 0)
      return await grab$1(path, {
        ...options,
        retryAttempts: --options.retryAttempts
      });
    if (!error.message.includes("signal") && options.debug) {
      logger(errorMessage, { color: "red" });
      if (debug && typeof document !== void 0) showAlert(errorMessage);
    }
    response.error = error.message;
    if (typeof response === "function") {
      response.data = response({ isLoading: void 0, error: error.message });
      response = response.data;
    } else response == null ? true : delete response.isLoading;
    if (typeof grab$1.log != "undefined")
      (_l = grab$1.log) == null ? void 0 : _l.unshift({
        path,
        request: JSON.stringify(params),
        error: error.message
      });
    return response;
  }
}
grab$1.instance = (defaults = {}) => (path, options = {}) => grab$1(path, { ...defaults, ...options });
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
if (typeof window !== "undefined") {
  window.log = log;
  window.grab = grab$1;
  window.grab.log = [];
  window.grab.mock = {};
  window.grab.defaults = {};
  setupDevTools();
  document.addEventListener("DOMContentLoaded", () => {
    let [scrollTop, scrollLeft, paginateElement] = JSON.parse(localStorage.getItem("scroll")) || [];
    if (!scrollTop) return;
    document.querySelector(paginateElement).scrollTop = scrollTop;
    document.querySelector(paginateElement).scrollLeft = scrollLeft;
  });
} else if (typeof global !== "undefined") {
  grab$1.log = [];
  grab$1.mock = {};
  grab$1.defaults = {};
  global.log = log;
  global.grab = grab$1.instance();
} else if (typeof globalThis !== "undefined") {
  grab$1.log = [];
  grab$1.mock = {};
  grab$1.defaults = {};
  globalThis.log = log;
  globalThis.grab = grab$1.instance();
}
export {
  grab$1 as default,
  grab$1 as grab,
  log,
  printJSONStructure,
  showAlert
};
//# sourceMappingURL=grab-api.es.js.map
