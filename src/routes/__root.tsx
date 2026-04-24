/// <reference types="vite/client" />
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query"
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/solid-router"
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools"
import * as Solid from "solid-js"
import { HydrationScript } from "solid-js/web"
import { DefaultCatchBoundary } from "~/components/errors"
import { Loading } from "~/components/loading"
import { NotFound } from "~/components/NotFound"

import appCss from "~/styles/app.css?url"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        {
          charset: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: "Scoreboard",
        },
        // ...seo({
        //   title:
        //     "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
        //   description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
        // }),
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        // { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "64x64",
          href: "/icons/favicon-64x64.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "128x128",
          href: "/icons/favicon-128x128.png",
        },
        {
          rel: "apple-touch-icon",
          type: "image/png",
          sizes: "180x180",
          href: "/icons/apple-touch-icon.png",
        },
        { rel: "icon", href: "/favicon.ico" },
      ],
    }),
    pendingComponent: Loading,
    errorComponent: DefaultCatchBoundary,
    notFoundComponent: () => <NotFound />,
    component: RootComponent,
  }
)

function RootComponent() {
  const router = useRouter()

  // Workaround: using nitro server seems to break automatic client install in router.ts
  return (
    <RootDocument>
      <QueryClientProvider client={router.options.context.queryClient}>
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: Solid.JSX.Element }>) {
  return (
    <html lang="en">
      <head>
        <HydrationScript />
      </head>
      <body>
        <HeadContent />
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <SolidQueryDevtools buttonPosition="bottom-left" />
        <Scripts />
      </body>
    </html>
  )
}
