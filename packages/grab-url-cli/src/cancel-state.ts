/**
 * @file cancel-state.ts
 * @description One flag shared by the transfer engines and the CLI: is the user
 * currently cancelling (possibly handing the transfer off to a background
 * process)?
 *
 * A cancel aborts in-flight requests, which surfaces as ordinary download
 * failures. Without this flag the CLI would print "Failed: 1/1" and an empty
 * stats table right before reporting a successful background handoff.
 */

let cancelInProgress = false;

/** Mark the start (or end) of a user-initiated cancellation. */
export function setCancelInProgress(value: boolean): void {
    cancelInProgress = value;
}

/** True while a cancellation or background handoff is underway. */
export function isCancelInProgress(): boolean {
    return cancelInProgress;
}
