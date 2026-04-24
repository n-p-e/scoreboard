/** biome-ignore-all lint/suspicious/noExplicitAny: for type gymnastics */
import { z } from "zod"

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type RouteDef<
  ReqBody extends z.ZodType = z.ZodType,
  ResBody extends z.ZodType = z.ZodType,
> = {
  method: Method
  path: string
  reqBody?: ReqBody
  resBody: ResBody
}

interface Contract<Definitions = any> {
  prefix: string
  definitions: Definitions
}

// Utility to define routes
export const endpoint = {
  get: (
    path: string,
    schemas: Omit<RouteDef, "method" | "path">
  ): RouteDef => ({ method: "GET", path, ...schemas }),
  post: <Req extends z.ZodTypeAny, Res extends z.ZodTypeAny>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "POST", path, ...schemas }),
  put: (
    path: string,
    schemas: Omit<RouteDef, "method" | "path">
  ): RouteDef => ({ method: "PUT", path, ...schemas }),
  patch: (
    path: string,
    schemas: Omit<RouteDef, "method" | "path">
  ): RouteDef => ({ method: "PATCH", path, ...schemas }),
  delete: (
    path: string,
    schemas: Omit<RouteDef, "method" | "path">
  ): RouteDef => ({ method: "DELETE", path, ...schemas }),
}

// --- Contract Builder ---

export const createContract = (options: { prefix: string }) => {
  return {
    routes: <T extends Record<string, RouteDef | Contract>>(
      definitions: T
    ): Contract<T> => ({
      prefix: options.prefix,
      definitions,
    }),
  }
}

// --- Client Factory ---
// --- Recursive Client Type ---

type Client<T> =
  T extends Contract<infer D>
    ? {
        [K in keyof D]: D[K] extends RouteDef<infer Req, infer Res>
          ? (
              args: D[K]["reqBody"] extends z.ZodTypeAny
                ? { body: z.infer<Req> }
                : { body?: never }
            ) => Promise<z.infer<Res>>
          : Client<D[K]>
      }
    : never

// --- Client Factory ---

export function createClient<T extends Contract>({
  contract,
  baseUrl,
  fetcher = fetch,
}: {
  contract: T
  baseUrl: string
  fetcher?: typeof fetch
}): Client<T> {
  // Helper to create the proxy recursively
  function createRecursiveProxy(
    currentContract: T,
    currentPath: string
  ): Client<T> {
    return new Proxy({} as Client<T>, {
      get(_, prop: string) {
        const item = currentContract.definitions[prop]
        if (!item) throw new Error(`Property ${prop} not found in contract`)

        // Calculate the new path (base + parent prefixes + current item prefix/path)
        const newPath = `${currentPath}${currentContract.prefix}`

        // If it's a sub-contract, return a new proxy for the next level
        if ("definitions" in item) {
          return createRecursiveProxy(item, newPath)
        }

        // If it's a route, return the execution function
        const route = item as RouteDef
        return async ({ body }: { body: unknown }) => {
          const finalUrl = `${baseUrl.replace(/\/$/, "")}${newPath}${route.path}`

          if (route.reqBody) route.reqBody.parse(body)

          const response = await fetcher(finalUrl, {
            method: route.method,
            headers: { "Content-Type": "application/json" },
            body: route.method !== "GET" ? JSON.stringify(body) : undefined,
          })

          const json = await response.json()
          return route.resBody.parse(json)
        }
      },
    })
  }

  return createRecursiveProxy(contract, "")
}
