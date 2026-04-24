/** biome-ignore-all lint/suspicious/noExplicitAny: for type gymnastics */
import * as z from "zod/mini"

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type ZodType = z.ZodMiniType

type RouteDef<
  ReqBody extends ZodType | undefined = undefined,
  ResBody extends ZodType = ZodType,
> = {
  method: Method
  path: string
  reqBody: ReqBody
  resBody: ResBody
}

type AnyRouteDef = RouteDef<ZodType | undefined, ZodType>

interface Contract<Definitions = any> {
  prefix: string
  definitions: Definitions
}

// Utility to define routes
export const endpoint = {
  get: <Res extends ZodType>(
    path: string,
    schemas: { resBody: Res }
  ): RouteDef<undefined, Res> => ({
    method: "GET",
    path,
    ...schemas,
    reqBody: undefined,
  }),
  post: <Req extends ZodType, Res extends ZodType>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "POST", path, ...schemas }),
  put: <Req extends ZodType, Res extends ZodType>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "PUT", path, ...schemas }),
  patch: <Req extends ZodType, Res extends ZodType>(
    path: string,
    schemas: { reqBody: Req; resBody: Res }
  ): RouteDef<Req, Res> => ({ method: "PATCH", path, ...schemas }),
  delete: <Res extends ZodType>(
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
          ? ReqBody extends ZodType
            ? (args: { body: z.input<ReqBody> }) => Promise<{
                status: number
                body: z.output<ResBody>
              }>
            : (args?: undefined) => Promise<{
                status: number
                body: z.output<ResBody>
              }>
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
        const route = item as RouteDef<ZodType | undefined, ZodType>
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
          return {
            status: response.status,
            body: route.resBody.parse(json),
          }
        }
      },
    })
  }

  return createRecursiveProxy(contract, "")
}
