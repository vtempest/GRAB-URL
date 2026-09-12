/**
 * @file sse.ts
 * @description Server-sent event streaming. Opens a `text/event-stream`
 * connection with `fetch` directly — SSE is a long-lived connection, not a
 * single request/response, so it bypasses grab's cache/retry/rate-limit
 * model rather than trying to fit inside it. Reconnects with exponential
 * backoff (honoring the server's `retry:` field and `Last-Event-ID`) until
 * the stream ends normally or the request is aborted.
 *
 * Ported from Hey API's client core (MIT) so an SSE endpoint behaves the
 * same on this client as it does on `@hey-api/client-fetch`.
 */

import type { Config } from "../types";

/** One event parsed off the wire. */
export interface StreamEvent<TData = unknown> {
  data: TData;
  event?: string;
  id?: string;
  retry?: number;
}

/** Options accepted by {@link createSseClient}. */
export type ServerSentEventsOptions<TData = unknown> = Omit<
  RequestInit,
  "method"
> &
  Pick<Config, "method" | "responseTransformer" | "responseValidator"> & {
    /** Fetch implementation to use. default=globalThis.fetch */
    fetch?: typeof fetch;
    /** Called before each connection attempt so interceptors can rewrite the request. */
    onRequest?: (url: string, init: RequestInit) => Promise<Request>;
    /** Called when a connection attempt fails, before it retries. */
    onSseError?: (error: unknown) => void;
    /** Called for every event streamed from the server. */
    onSseEvent?: (event: StreamEvent<TData>) => void;
    /** Body already run through `bodySerializer`. */
    serializedBody?: RequestInit["body"];
    /** default=3000 Delay before the first retry, in ms. */
    sseDefaultRetryDelay?: number;
    /** Give up after this many retry attempts. */
    sseMaxRetryAttempts?: number;
    /** default=30000 Cap on the exponential backoff delay, in ms. */
    sseMaxRetryDelay?: number;
    /** Overrides the retry backoff wait. default=setTimeout-based sleep */
    sseSleepFn?: (ms: number) => Promise<void>;
    url: string;
  };

/** What {@link createSseClient} returns: an async generator of parsed event data. */
export type ServerSentEventsResult<
  TData = unknown,
  TReturn = void,
  TNext = unknown,
> = {
  stream: AsyncGenerator<
    TData extends Record<string, unknown> ? TData[keyof TData] : TData,
    TReturn,
    TNext
  >;
};

/**
 * Opens a `text/event-stream` connection and yields each event's parsed
 * `data`.
 *
 * @param options - Request to open, plus SSE-specific callbacks and retry settings.
 * @returns An object holding the `stream` async generator.
 */
export function createSseClient<TData = unknown>({
  onRequest,
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}: ServerSentEventsOptions<TData>): ServerSentEventsResult<TData> {
  let lastEventId: string | undefined;

  const sleep =
    sseSleepFn ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  const createStream = async function* () {
    let retryDelay = sseDefaultRetryDelay ?? 3000;
    let attempt = 0;
    const signal = options.signal ?? new AbortController().signal;

    while (true) {
      if (signal.aborted) break;

      attempt++;

      const headers =
        options.headers instanceof Headers
          ? options.headers
          : new Headers(options.headers as Record<string, string> | undefined);

      if (lastEventId !== undefined) headers.set("Last-Event-ID", lastEventId);

      try {
        const requestInit: RequestInit = {
          redirect: "follow",
          ...options,
          body: options.serializedBody as BodyInit | null | undefined,
          headers,
          signal,
        };
        let request = new Request(url, requestInit);
        if (onRequest) request = await onRequest(url, requestInit);

        // fetch must be assigned here, otherwise it throws:
        // TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation
        const _fetch = options.fetch ?? globalThis.fetch;
        const response = await _fetch(request);

        if (!response.ok)
          throw new Error(`SSE failed: ${response.status} ${response.statusText}`);
        if (!response.body) throw new Error("No body in SSE response");

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        let buffer = "";

        const abortHandler = () => {
          try {
            reader.cancel();
          } catch {
            // noop
          }
        };

        signal.addEventListener("abort", abortHandler);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += value;
            buffer = buffer.replace(/\r\n?/g, "\n"); // normalize line endings

            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() ?? "";

            for (const chunk of chunks) {
              const lines = chunk.split("\n");
              const dataLines: string[] = [];
              let eventName: string | undefined;

              for (const line of lines) {
                if (line.startsWith("data:"))
                  dataLines.push(line.replace(/^data:\s*/, ""));
                else if (line.startsWith("event:"))
                  eventName = line.replace(/^event:\s*/, "");
                else if (line.startsWith("id:"))
                  lastEventId = line.replace(/^id:\s*/, "");
                else if (line.startsWith("retry:")) {
                  const parsed = Number.parseInt(
                    line.replace(/^retry:\s*/, ""),
                    10,
                  );
                  if (!Number.isNaN(parsed)) retryDelay = parsed;
                }
              }

              let data: unknown;
              let parsedJson = false;

              if (dataLines.length) {
                const rawData = dataLines.join("\n");
                try {
                  data = JSON.parse(rawData);
                  parsedJson = true;
                } catch {
                  data = rawData;
                }
              }

              if (parsedJson) {
                if (responseValidator) await responseValidator(data);
                if (responseTransformer) data = await responseTransformer(data);
              }

              onSseEvent?.({
                data: data as TData,
                event: eventName,
                id: lastEventId,
                retry: retryDelay,
              });

              if (dataLines.length) yield data as any;
            }
          }
        } finally {
          signal.removeEventListener("abort", abortHandler);
          reader.releaseLock();
        }

        break; // exit loop on normal completion
      } catch (error) {
        // connection failed or aborted; retry after delay
        onSseError?.(error);

        if (
          sseMaxRetryAttempts !== undefined &&
          attempt >= sseMaxRetryAttempts
        )
          break; // stop after firing error

        // exponential backoff, capped at sseMaxRetryDelay
        const backoff = Math.min(
          retryDelay * 2 ** (attempt - 1),
          sseMaxRetryDelay ?? 30000,
        );
        await sleep(backoff);
      }
    }
  };

  return { stream: createStream() };
}
