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

export type RouteDef<
  PathParams extends ZodType | undefined = undefined,
  QueryParams extends ZodType | undefined = undefined,
  ReqBody extends ZodType | undefined = undefined,
  ResBody extends ZodType = ZodType,
> = {
  method: Method
  path: string
  pathParams: PathParams
  queryParams: QueryParams
  reqBody: ReqBody
  resBody: ResBody
}

export type AnyRouteDef = RouteDef<
  ZodType | undefined,
  ZodType | undefined,
  ZodType | undefined,
  ZodType
>

/**
 * We constrain Definitions to ensure it only contains Routes or sub-Contracts.
 */
export interface Contract<Definitions = Record<string, AnyRouteDef | unknown>> {
  prefix: string
  definitions: Definitions
}

export type ClientResponse<ResBody extends ZodType> = Promise<{
  status: number
  body: z.output<ResBody>
}>

/**
 * Maps Zod schemas to a unified Input type.
 */
type RouteArgs<
  PathParams extends ZodType | undefined,
  QueryParams extends ZodType | undefined,
  ReqBody extends ZodType | undefined,
> = Prettify<
  ([PathParams] extends [ZodType]
    ? { params: z.input<PathParams> }
    : Record<never, never>) &
    ([QueryParams] extends [ZodType]
      ? { query: z.input<QueryParams> }
      : Record<never, never>) &
    ([ReqBody] extends [ZodType]
      ? { body: z.input<ReqBody> }
      : Record<never, never>)
>

/**
 * Determines if a route requires an arguments object or not.
 */
type IsEmpty<T> = keyof T extends never ? true : false

// --- Endpoint Builder ---

const createEndpoint =
  (method: Method) =>
  <
    Res extends ZodType,
    Req extends ZodType | undefined = undefined,
    Params extends ZodType | undefined = undefined,
    Query extends ZodType | undefined = undefined,
  >(
    path: string,
    schemas: {
      pathParams?: Params
      queryParams?: Query
      reqBody?: Req
      resBody: Res
    }
  ): RouteDef<Params, Query, Req, Res> => ({
    method,
    path,
    pathParams: schemas.pathParams as Params,
    queryParams: schemas.queryParams as Query,
    reqBody: schemas.reqBody as Req,
    resBody: schemas.resBody,
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
    routes: <T extends Record<string, AnyRouteDef | Contract>>(
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

export type Client<T> =
  T extends Contract<infer D>
    ? {
        [K in keyof D]: D[K] extends RouteDef<
          infer P,
          infer Q,
          infer B,
          infer Res
        >
          ? IsEmpty<RouteArgs<P, Q, B>> extends true
            ? (args?: CommonClientArgs) => ClientResponse<Res>
            : (
                args: CommonClientArgs & RouteArgs<P, Q, B>
              ) => ClientResponse<Res>
          : Client<D[K]>
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
            | AnyRouteDef
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
