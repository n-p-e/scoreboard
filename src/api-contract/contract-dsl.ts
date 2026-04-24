/** biome-ignore-all lint/suspicious/noExplicitAny: for type gymnastics */
import * as z from "zod/mini"

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type ZodType = z.ZodMiniType

type RouteDef<
  PathParams extends ZodType | undefined = undefined,
  ReqBody extends ZodType | undefined = undefined,
  ResBody extends ZodType = ZodType,
> = {
  method: Method
  path: string
  pathParams: PathParams
  reqBody: ReqBody
  resBody: ResBody
}

type AnyRouteDef = RouteDef<ZodType | undefined, ZodType | undefined, ZodType>

interface Contract<Definitions = any> {
  prefix: string
  definitions: Definitions
}

type ClientResponse<ResBody extends ZodType> = Promise<{
  status: number
  body: z.output<ResBody>
}>

type RouteArgs<
  PathParams extends ZodType | undefined,
  ReqBody extends ZodType | undefined,
> = [PathParams] extends [ZodType]
  ? [ReqBody] extends [ZodType]
    ? { params: z.input<PathParams>; body: z.input<ReqBody> }
    : { params: z.input<PathParams> }
  : [ReqBody] extends [ZodType]
    ? { body: z.input<ReqBody> }
    : undefined

// Utility to define routes
export const endpoint = {
  get: <Res extends ZodType, Params extends ZodType | undefined = undefined>(
    path: string,
    schemas: { pathParams?: Params; resBody: Res }
  ): RouteDef<Params, undefined, Res> => ({
    method: "GET",
    path,
    pathParams: schemas.pathParams as Params,
    ...schemas,
    reqBody: undefined,
  }),
  post: <
    Req extends ZodType,
    Res extends ZodType,
    Params extends ZodType | undefined = undefined,
  >(
    path: string,
    schemas: { pathParams?: Params; reqBody: Req; resBody: Res }
  ): RouteDef<Params, Req, Res> => ({
    method: "POST",
    path,
    pathParams: schemas.pathParams as Params,
    ...schemas,
  }),
  put: <
    Req extends ZodType,
    Res extends ZodType,
    Params extends ZodType | undefined = undefined,
  >(
    path: string,
    schemas: { pathParams?: Params; reqBody: Req; resBody: Res }
  ): RouteDef<Params, Req, Res> => ({
    method: "PUT",
    path,
    pathParams: schemas.pathParams as Params,
    ...schemas,
  }),
  patch: <
    Req extends ZodType,
    Res extends ZodType,
    Params extends ZodType | undefined = undefined,
  >(
    path: string,
    schemas: { pathParams?: Params; reqBody: Req; resBody: Res }
  ): RouteDef<Params, Req, Res> => ({
    method: "PATCH",
    path,
    pathParams: schemas.pathParams as Params,
    ...schemas,
  }),
  delete: <Res extends ZodType, Params extends ZodType | undefined = undefined>(
    path: string,
    schemas: { pathParams?: Params; resBody: Res }
  ): RouteDef<Params, undefined, Res> => ({
    method: "DELETE",
    path,
    pathParams: schemas.pathParams as Params,
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

interface CommonClientArgs {
  fetchOptions?: RequestInit
}

type Client<T> =
  T extends Contract<infer D>
    ? {
        [K in keyof D]: D[K] extends RouteDef<
          infer PathParams,
          infer ReqBody,
          infer ResBody
        >
          ? RouteArgs<PathParams, ReqBody> extends undefined
            ? (args?: CommonClientArgs) => ClientResponse<ResBody>
            : (
                args: CommonClientArgs & RouteArgs<PathParams, ReqBody>
              ) => ClientResponse<ResBody>
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
        const route = item as RouteDef<
          ZodType | undefined,
          ZodType | undefined,
          ZodType
        >
        return async (args?: {
          params?: unknown
          body?: unknown
          fetchOptions?: RequestInit
        }) => {
          const body = args?.body
          const params = route.pathParams?.parse(args?.params)
          const finalPath = interpolatePath(route.path, params)
          const finalUrl = `${baseUrl.replace(/\/$/, "")}${newPath}${finalPath}`

          // parse the req body through zod here
          const parsedReqBody = route.reqBody?.parse(body)

          const response = await fetcher(finalUrl, {
            method: route.method,
            headers: { "Content-Type": "application/json" },
            body:
              route.method !== "GET"
                ? JSON.stringify(parsedReqBody)
                : undefined,
            ...args?.fetchOptions,
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
