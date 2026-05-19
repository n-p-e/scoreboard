/** biome-ignore-all lint/suspicious/noExplicitAny: type gymnastics */
import * as z from "zod/mini"

export type Fetcher = (
  ...args: Parameters<typeof fetch>
) => ReturnType<typeof fetch>

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type ZodType = z.ZodMiniType

/**
 * Prettify: Flattens intersections for better IDE tooltips.
 */
type Prettify<T> = {
  [K in keyof T]: T[K]
} & Record<never, never>

/**
 * The definition supplied by DSL
 */
export interface RouteDef {
  queryParams?: ZodType
  pathParams?: ZodType
  reqBody?: ZodType
  resBody: ZodType
}

/**
 * Combined with the endpoint output
 */
export interface RouteData extends RouteDef {
  path: string
  method: Method
}

export interface Contract<Definitions = any> {
  prefix: string
  definitions: Definitions
}

export type ClientResponse<ResBody extends ZodType> = Promise<{
  status: number
  body: z.output<ResBody>
}>

type RouteArgs<T extends RouteDef> = Prettify<
  (T["pathParams"] extends ZodType
    ? { params: z.input<T["pathParams"]> }
    : Record<never, never>) &
    (T["queryParams"] extends ZodType
      ? { query: z.input<T["queryParams"]> }
      : Record<never, never>) &
    (T["reqBody"] extends ZodType
      ? { body: z.input<T["reqBody"]> }
      : Record<never, never>)
>

type IsEmpty<T> = keyof T extends never ? true : false

// --- Endpoint Builder ---

const createEndpoint =
  (method: Method) =>
  <R extends RouteDef>(
    path: string,
    routeConfig: R
  ): R & { method: Method; path: string } => ({
    ...routeConfig,
    path,
    method,
  })

export const endpoint = {
  get: createEndpoint("GET"),
  post: createEndpoint("POST"),
  put: createEndpoint("PUT"),
  patch: createEndpoint("PATCH"),
  delete: createEndpoint("DELETE"),
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

// --- Client Types ---

export interface CommonClientArgs {
  fetchOptions?: RequestInit
}

// Client type: D is the definition map
export type Client<T> =
  T extends Contract<infer Def>
    ? {
        // is it a route definition?
        [K in keyof Def]: Def[K] extends RouteData
          ? // the function async (args) => response
            IsEmpty<RouteArgs<Def[K]>> extends true
            ? (args?: CommonClientArgs) => ClientResponse<Def[K]["resBody"]>
            : (
                args: CommonClientArgs & RouteArgs<Def[K]>
              ) => ClientResponse<Def[K]["resBody"]>
          : // recurse
            Def[K] extends Contract<any>
            ? Client<Def[K]>
            : never
      }
    : never

export type ErrorHandler = (response: Response) => never | Promise<never>

// --- Client Factory ---

export function createClient<T extends Contract>({
  contract,
  baseUrl,
  onError,
  fetcher = fetch,
}: {
  contract: T
  baseUrl: string
  fetcher?: Fetcher
  onError: ErrorHandler
}): Client<T> {
  function createRecursiveProxy(
    currentContract: Contract,
    currentPath: string
  ): unknown {
    return new Proxy(
      {},
      {
        get(_, prop: string) {
          const item = currentContract.definitions[prop] as
            | RouteData
            | Contract
            | undefined
          if (!item) throw new Error(`Property ${prop} not found in contract`)

          const newPath = `${currentPath}${currentContract.prefix}`

          if ("definitions" in item) {
            return createRecursiveProxy(item as Contract, newPath)
          }

          const route = item
          return async (args?: {
            params?: unknown
            query?: unknown
            body?: unknown
            fetchOptions?: RequestInit
          }) => {
            const params = route.pathParams?.parse(args?.params)
            const query = route.queryParams?.parse(args?.query)
            const finalPath = interpolatePath(route.path, params)
            const finalUrl = appendQueryString(
              `${baseUrl.replace(/\/$/, "")}${newPath}${finalPath}`,
              query
            )

            const parsedReqBody = route.reqBody?.parse(args?.body)

            const response = await fetcher(finalUrl, {
              method: route.method,
              headers: { "Content-Type": "application/json" },
              body:
                route.method !== "GET"
                  ? JSON.stringify(parsedReqBody)
                  : undefined,
              ...args?.fetchOptions,
            })

            if (!response.ok) {
              await onError(response)
              throw Error("shouldn't reach here!")
            }

            const json = await response.json()
            return {
              status: response.status,
              body: route.resBody.parse(json),
            }
          }
        },
      }
    )
  }

  return createRecursiveProxy(contract, "") as Client<T>
}

function interpolatePath(path: string, params: unknown) {
  const pathParams = params as Record<string, unknown> | undefined
  return path.replaceAll(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = pathParams?.[key]
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(`Invalid or missing path param: ${key}`)
    }
    return encodeURIComponent(String(value))
  })
}

function appendQueryString(url: string, query: unknown) {
  const queryParams = query as Record<string, unknown> | undefined
  if (!queryParams) return url

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(queryParams)) {
    if (value == null) continue
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(`Invalid query param: ${key}`)
    }
    searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}
