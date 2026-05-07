/**
 * @module svelte-shims
 * Ambient type shim so non-Svelte tooling (plain `tsc`) can resolve
 * `*.svelte` imports without the official Svelte language tooling.
 *
 * Consumers using SvelteKit / svelte-loader / vite-plugin-svelte already
 * provide richer types, which take precedence over this fallback.
 */
declare module "*.svelte" {
  import type { SvelteComponent } from "svelte"
  // biome-ignore lint/suspicious/noExplicitAny: generic component default props
  const component: typeof SvelteComponent<any>
  export default component
}
