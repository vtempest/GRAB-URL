/**
 * @file core/request-executor.ts
 * @description Logic for preparing and executing API requests.
 * Handles both mock responses and real network fetch calls.
 */

import { GrabFunction, GrabMockHandler } from "../common/types";
import { wait } from "../common/utils";

/**
 * Prepares the fetch parameters and URL.
 */
export function prepareFetchRequest(
    method: string,
    headers: any,
    body: any,
    params: any,
    cache: boolean,
    signal: AbortSignal
): { fetchParams: RequestInit; paramsGETRequest: string } {
    const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);

    const fetchParams: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...headers,
        },
        body: body || (isBodyMethod ? JSON.stringify(params) : null),
        redirect: "follow",
        cache: cache ? "force-cache" : "no-store",
        signal,
    };

    let paramsGETRequest = "";
    if (!isBodyMethod) {
        paramsGETRequest = (Object.keys(params).length ? "?" : "") + new URLSearchParams(params).toString();
    }

    return { fetchParams, paramsGETRequest };
}

/**
 * Executes the request, either via mock or actual fetch.
 */
export async function executeRequest(
    baseURL: string,
    path: string,
    paramsGETRequest: string,
    fetchParams: RequestInit,
    params: any,
    onStream: any
): Promise<any> {
    const target = (typeof window !== "undefined" ? window.grab : (globalThis as any).grab) as GrabFunction;
    const mockHandler = target?.mock?.[path] as GrabMockHandler;
    const paramsAsText = JSON.stringify(params);

    if (mockHandler &&
        (!mockHandler.method || mockHandler.method === fetchParams.method) &&
        (!mockHandler.params || paramsAsText === JSON.stringify(mockHandler.params))) {
        await wait(mockHandler.delay || 0);
        return typeof mockHandler.response === "function" ? mockHandler.response(params) : mockHandler.response;
    }

    const fetchRes = await fetch(baseURL + path + paramsGETRequest, fetchParams).catch(e => {
        throw new Error(e.message);
    });

    if (!fetchRes.ok) throw new Error(`HTTP error: ${fetchRes.status} ${fetchRes.statusText}`);

    if (onStream) {
        await onStream(fetchRes.body);
        return null;
    }

    const type = fetchRes.headers.get("content-type");
    return await (
        type
            ? type.includes("application/json")
                ? fetchRes.json()
                : type.includes("application/pdf") || type.includes("application/octet-stream")
                    ? fetchRes.blob()
                    : fetchRes.text()
            : fetchRes.json()
    ).catch(e => {
        throw new Error("Error parsing response: " + e);
    });
}
