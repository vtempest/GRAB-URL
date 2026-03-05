/**
 * @file ui/devtools.ts
 * @description Visual development tools for the Grab API.
 * Includes a modal overlay for inspect request history (Ctrl+Alt+I).
 */

import { printJSONStructure } from "../logging/log-json";
import { GrabFunction } from "../common/types";

/**
 * Shows a message in a modal overlay with a scrollable message stack.
 * Easier to dismiss than native alert() and does not block window execution.
 * 
 * @param msg - The message or HTML content to display.
 */
export function showAlert(msg: string) {
    if (typeof document === "undefined") return;
    let o = document.getElementById("alert-overlay"),
        list: HTMLElement;

    if (!o) {
        o = document.body.appendChild(document.createElement("div"));
        o.id = "alert-overlay";
        o.setAttribute(
            "style",
            "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center",
        );
        o.innerHTML = `<div id="alert-box" style="background:#fff;padding:1.5em 2em;border-radius:8px;box-shadow:0 2px 16px #0003;min-width:220px;max-height:80vh;position:relative;display:flex;flex-direction:column;">
      <button id="close-alert" style="position:absolute;top:12px;right:20px;font-size:1.5em;background:none;border:none;cursor:pointer;color:black;">&times;</button>
      <div id="alert-list" style="overflow:auto;flex:1;"></div>
    </div>`;

        o.addEventListener("click", (e) => e.target == o && o!.remove());
        const closeBtn = document.getElementById("close-alert");
        if (closeBtn) closeBtn.onclick = () => o!.remove();
    }

    list = document.getElementById("alert-list")!;
    list.innerHTML += `<div style="border-bottom:1px solid #333; font-size:1.2em;margin:0.5em 0;">${msg}</div>`;
}

/**
 * Sets up development tools for debugging API requests.
 * Adds a keyboard shortcut (Ctrl+Alt+I) to toggle a modal showing the request history from `grab.log`.
 */
export function setupDevTools() {
    if (typeof document === "undefined") return;

    document.addEventListener("keydown", (e) => {
        // Check for global grab on window
        const grab = (window as any).grab as GrabFunction;
        if (!grab || !grab.log) return;

        if (e.key === "i" && e.ctrlKey && e.altKey) {
            let html = " ";
            for (let request of grab.log) {
                html += `<div style="margin-bottom:1em; border-bottom:1px solid #ccc; padding-bottom:1em;">
          <b>Path:</b> ${request.path}<br>
          <b>Request:</b> ${printJSONStructure(request.request, 0, "html")}<br>
          <b>Response:</b> ${printJSONStructure(
                    request.response,
                    0,
                    "html",
                )}<br> 
          <b>Time:</b> ${new Date(request.lastFetchTime).toLocaleString()}
        </div>`;
            }
            showAlert(html);
        }
    });
}
