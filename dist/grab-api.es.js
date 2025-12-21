import { log, printJSONStructure } from "./log.es.js";
async function grab(path, options) {
  var {
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
    ...typeof window !== "undefined" ? window?.grab?.defaults : (global || globalThis)?.grab?.defaults || {},
    ...options
  };
  let s = (t) => path.startsWith(t);
  if (s("http:") || s("https:")) baseURL = "";
  else if (!s("/") && !baseURL.endsWith("/")) path = "/" + path;
  else if (s("/") && baseURL.endsWith("/")) path = path.slice(1);
  try {
    if (debounce > 0)
      return await debouncer(async () => {
        await grab(path, { ...options, debounce: 0 });
      }, debounce * 1e3);
    if (repeat > 1) {
      for (let i = 0; i < repeat; i++) {
        await grab(path, { ...options, repeat: 0 });
      }
      return response;
    }
    if (repeatEvery) {
      setInterval(async () => {
        await grab(path, { ...options, repeat: 0, repeatEvery: null });
      }, repeatEvery * 1e3);
      return response;
    }
    if (options?.setDefaults) {
      if (typeof window !== "undefined")
        window.grab.defaults = { ...options, setDefaults: void 0 };
      else if (typeof (global || globalThis).grab !== "undefined")
        (global || globalThis).grab.defaults = {
          ...options,
          setDefaults: void 0
        };
      return;
    }
    if (typeof window !== "undefined") {
      const regrab = async () => await grab(path, { ...options, cache: false });
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
    if (infiniteScroll?.length && typeof paginateElement !== "undefined" && typeof window !== "undefined") {
      let paginateDOM = typeof paginateElement === "string" ? document.querySelector(paginateElement) : paginateElement;
      if (!paginateDOM) log("paginateDOM not found", { color: "red" });
      else if (window.scrollListener && typeof paginateDOM !== "undefined" && typeof paginateDOM.removeEventListener === "function")
        paginateDOM.removeEventListener("scroll", window.scrollListener);
      window.scrollListener = async (event) => {
        const t = event.target;
        localStorage.setItem(
          "scroll",
          JSON.stringify([t.scrollTop, t.scrollLeft, paginateElement])
        );
        if (t.scrollHeight - t.scrollTop <= t.clientHeight + 200) {
          await grab(path, {
            ...options,
            cache: false,
            [paginateKey]: priorRequest?.currentPage + 1
          });
        }
      };
      if (paginateDOM)
        paginateDOM.addEventListener("scroll", window.scrollListener);
    }
    let paramsAsText = JSON.stringify(
      paginateKey ? { ...params, [paginateKey]: void 0 } : params
    );
    let priorRequest = grab?.log?.find(
      (e) => e.request == paramsAsText && e.path == path
    );
    if (!paginateKey) {
      for (let key of Object.keys(response)) response[key] = void 0;
      if (cache && (!cacheForTime || priorRequest?.lastFetchTime > Date.now() - 1e3 * cacheForTime)) {
        for (let key of Object.keys(priorRequest.res))
          response[key] = priorRequest.res[key];
        if (resFunction) response = resFunction(response);
      }
    } else {
      let pageNumber = priorRequest?.currentPage + 1 || params?.[paginateKey] || 1;
      if (!priorRequest) {
        response[paginateResult] = [];
        pageNumber = 1;
      }
      if (priorRequest) priorRequest.currentPage = pageNumber;
      params = { ...params, [paginateKey]: pageNumber };
    }
    if (resFunction) resFunction({ isLoading: true });
    else if (typeof response === "object") response.isLoading = true;
    if (resFunction) response = resFunction(response);
    if (rateLimit > 0 && priorRequest?.lastFetchTime && priorRequest.lastFetchTime > Date.now() - 1e3 * rateLimit)
      throw new Error(`Fetch rate limit exceeded for ${path}. 
        Wait ${rateLimit}s between requests.`);
    if (priorRequest?.controller) {
      if (cancelOngoingIfNew) priorRequest.controller.abort();
      else if (cancelNewIfOngoing) return { isLoading: true };
    }
    if (typeof grab.log != "undefined")
      grab.log?.unshift({
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
      signal: cancelOngoingIfNew ? grab.log[0]?.controller?.signal : AbortSignal.timeout(timeout * 1e3)
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
    let res = null, startTime = /* @__PURE__ */ new Date(), mockHandler = grab.mock?.[path];
    let wait = (s2) => new Promise((res2) => setTimeout(res2, s2 * 1e3 || 0));
    if (mockHandler && (!mockHandler.params || mockHandler.method == method) && (!mockHandler.params || paramsAsText == JSON.stringify(mockHandler.params))) {
      await wait(mockHandler.delay);
      res = typeof mockHandler.response === "function" ? mockHandler.response(params) : mockHandler.response;
    } else {
      res = await fetch(baseURL + path + paramsGETRequest, fetchParams).catch(
        (e) => {
          throw new Error(e.message);
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
    else if (typeof response === "object") delete response?.isLoading;
    delete priorRequest?.controller;
    const elapsedTime = ((Number(/* @__PURE__ */ new Date()) - Number(startTime)) / 1e3).toFixed(1);
    if (debug) {
      logger(
        "Path:" + baseURL + path + paramsGETRequest + "\n" + JSON.stringify(options, null, 2) + "\nTime: " + elapsedTime + "s\nResponse: " + printJSONStructure(res)
      );
    }
    if (typeof res === "object") {
      for (let key of Object.keys(res))
        response[key] = paginateResult == key && response[key]?.length ? [...response[key], ...res[key]] : res[key];
      if (typeof response !== "undefined") response.data = res;
    } else if (resFunction) resFunction({ data: res, ...res });
    else if (typeof response === "object") response.data = res;
    if (typeof grab.log != "undefined")
      grab.log?.unshift({
        path,
        request: JSON.stringify({ ...params, paginateKey: void 0 }),
        response,
        lastFetchTime: Date.now()
      });
    if (resFunction) response = resFunction(response);
    return response;
  } catch (error) {
    let errorMessage = "Error: " + error.message + "\nPath:" + baseURL + path + "\n";
    if (typeof onError === "function")
      onError(error.message, baseURL + path, params);
    if (options.retryAttempts > 0)
      return await grab(path, {
        ...options,
        retryAttempts: --options.retryAttempts
      });
    if (!error.message.includes("signal") && options.debug) {
      logger(errorMessage, { color: "red" });
      if (debug && typeof document !== "undefined") showAlert(errorMessage);
    }
    response.error = error.message;
    if (typeof response === "function") {
      response.data = response({ isLoading: void 0, error: error.message });
      response = response.data;
    } else delete response?.isLoading;
    if (typeof grab.log != "undefined")
      grab.log?.unshift({
        path,
        request: JSON.stringify(params),
        error: error.message
      });
    return response;
  }
}
grab.instance = (defaults = {}) => (path, options = {}) => grab(path, { ...defaults, ...options });
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
  window.grab = grab;
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
  grab.log = [];
  grab.mock = {};
  grab.defaults = {};
  global.log = log;
  global.grab = grab.instance();
} else if (typeof globalThis !== "undefined") {
  grab.log = [];
  grab.mock = {};
  grab.defaults = {};
  globalThis.log = log;
  globalThis.grab = grab.instance();
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
    if (e.key === "i" && e.ctrlKey && e.altKey) {
      let html = " ";
      for (let request of grab.log) {
        html += `<div style="margin-bottom:1em; border-bottom:1px solid #ccc; padding-bottom:1em;">
          <b>Path:</b> ${request.path}<br>
          <b>Request:</b> ${printJSONStructure(request.request, 0, "html")}<br>
          <b>Response:</b> ${printJSONStructure(request.response, 0, "html")}<br> 
          <b>Time:</b> ${new Date(request.lastFetchTime).toLocaleString()}
        </div>`;
      }
      showAlert(html);
    }
  });
}
export {
  grab as default,
  grab,
  log,
  printJSONStructure,
  setupDevTools,
  showAlert
};
//# sourceMappingURL=grab-api.es.js.map
