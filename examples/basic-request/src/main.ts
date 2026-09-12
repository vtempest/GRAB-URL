import grab from "grab-url";

const output = document.querySelector<HTMLPreElement>("#output")!;

function log(...args: unknown[]) {
  output.textContent += `\n${args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
    .join(" ")}`;
}

async function run() {
  output.textContent = "GET /users/1";
  const user = await grab("https://jsonplaceholder.typicode.com/users/1");
  log("GET result:", user);

  output.textContent += "\n\nGET with query params";
  const posts = await grab("https://jsonplaceholder.typicode.com/posts", {
    userId: 1,
  });
  log("Query result:", posts.slice(0, 2));

  output.textContent += "\n\nPOST with body";
  const created = await grab("https://jsonplaceholder.typicode.com/posts", {
    post: true, // shorthand for method: "POST"
    title: "Hello from grab-url",
    body: "Runnable in StackBlitz",
    userId: 1,
  });
  log("POST result:", created);
}

run().catch((error) => log("Error:", error.message));
