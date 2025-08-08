/**
 * Import this module in sensitive files that should not be bundled in the client.
 *
 * If by mistake the file is imported in client code, an error is generated
 * by denyImports plugin from vite-env-only.
 *
 * ```js
 * import '~/server/server-only'
 * ```
 */
export const _serverOnly = "This file is marked server-only"
export default _serverOnly

if (typeof process === "undefined") {
  throw new Error("This file is marked server-only")
}
