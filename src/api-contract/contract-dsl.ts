/** biome-ignore-all lint/suspicious/noExplicitAny: for type gymnastics */
import { z } from "zod"

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type RouteDef<
  ReqBody extends z.ZodTypeAny | undefined = undefined,
  ResBody extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  method: Method
  path: string
  reqBody: ReqBody
  resBody: ResBody
}

type AnyRouteDef = RouteDef<z.ZodTypeAny | undefined, z.ZodTypeAny>

interface Contract<Definitions = any> {
  prefix: string
  definitions: Definitions
}

// Utility to define routes
export const endpoint = {
  get: <Res extends z.ZodTypeAny>(
    path: string,
    schemas: { resBody: Res }
  ): RouteDef<undefined, Res> => ({
    method: "GET",
    path,
    reqBody: undefined,
    ...schemas,
  }),
  post: <Req extends z.ZodTypeAny, Res extends z.ZodTypeAny>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "POST", path, ...schemas }),
  put: <Req extends z.ZodTypeAny, Res extends z.ZodTypeAny>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "PUT", path, ...schemas }),
  patch: <Req extends z.ZodTypeAny, Res extends z.ZodTypeAny>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "PATCH", path, ...schemas }),
  delete: <Res extends z.ZodTypeAny>(
    path: string,
    schemas: { resBody: Res }
  ): RouteDef<undefined, Res> => ({
    method: "DELETE",
    path,
    reqBody: undefined,
    ...schemas,
  }),
}

// --- Contract Builder ---

export const createContract = (options: { prefix: string }) => {
  return {
    routes: <T extends Record<string, AnyRouteDef | Contract>>(
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
        [K in keyof D]: D[K] extends RouteDef<infer ReqBody, infer ResBody>
          ? ReqBody extends z.ZodTypeAny
            ? (args: { body: z.input<ReqBody> }) => Promise<z.output<ResBody>>
            : (args?: { query?: string }) => Promise<z.output<ResBody>>
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
  function createRecursiveProxy<TCurrent extends Contract>(
    currentContract: TCurrent,
    currentPath: string
  ): Client<TCurrent> {
    return new Proxy({} as Client<TCurrent>, {
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
        const route = item as RouteDef<z.ZodTypeAny | undefined, z.ZodTypeAny>
        return async (args?: { body?: unknown }) => {
          const body = args?.body
          const finalUrl = `${baseUrl.replace(/\/$/, "")}${newPath}${route.path}`

          // parse the req body through zod here
          const parsedReqBody = route.reqBody?.parse(body)

          const response = await fetcher(finalUrl, {
            method: route.method,
            headers: { "Content-Type": "application/json" },
            body:
              route.method !== "GET"
                ? JSON.stringify(parsedReqBody)
                : undefined,
          })

          const json = await response.json()
          return route.resBody.parse(json)
        }
      },
    })
  }

  return createRecursiveProxy(contract, "")
}
