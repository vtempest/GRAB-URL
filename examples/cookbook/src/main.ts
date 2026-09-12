import grab from "grab-url";

const output = document.querySelector<HTMLPreElement>("#output")!;
const log = (...args: unknown[]) =>
  (output.textContent += `\n${args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ")}`);

const API = "https://jsonplaceholder.typicode.com";

// --- Client cache: repeat calls skip the network ---
async function cacheDemo() {
  const users = await grab(`${API}/users`, { cache: true });
  log("cache: first call ->", users.length, "users");
  const usersAgain = await grab(`${API}/users`, { cache: true });
  log("cache: second call (instant, no network) ->", usersAgain.length, "users");
}

// --- Rate limiting: reject calls that arrive too soon ---
const rateLimitedResults = {};
async function rateLimitDemo() {
  grab(`${API}/posts/1`, { response: rateLimitedResults, rateLimit: 2 });
  log("rate limit: first call fires immediately");
  grab(`${API}/posts/2`, { response: rateLimitedResults, rateLimit: 2 }).catch(
    (e) => log("rate limit: second call rejected ->", e.message),
  );
}

// --- Error handling and retry ---
async function retryDemo() {
  try {
    const result = await grab(`${API}/posts/1`, {
      retryAttempts: 3,
      timeout: 10,
    });
    log("retry: success ->", result.title);
  } catch (error) {
    log("retry: failed after retries ->", (error as Error).message);
  }
}

// --- Request hooks / interceptors ---
async function interceptorDemo() {
  grab.defaults.onRequest = (path, response, params, fetchParams) => {
    fetchParams.headers.Authorization = "Bearer demo-token";
    return [path, response, params, fetchParams];
  };
  const post = await grab(`${API}/posts/1`);
  log("interceptor: request went out with an Authorization header ->", post.title);
}

// --- Debounced search, wired to the #search input ---
const searchResults = {};
document.querySelector<HTMLInputElement>("#search")!.addEventListener("input", (e) => {
  const query = (e.target as HTMLInputElement).value;
  grab(`${API}/posts`, {
    response: searchResults,
    debounce: 0.4,
    query,
    cancelOngoingIfNew: true,
  }).then(() => log("debounce: search settled for", JSON.stringify(query)));
});

// --- File upload ---
document.querySelector<HTMLInputElement>("#file")!.addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  const response = await grab(`${API}/posts`, {
    post: true,
    body: formData,
  });
  log("upload: server echoed ->", response);
});

cacheDemo();
rateLimitDemo();
retryDemo();
interceptorDemo();
