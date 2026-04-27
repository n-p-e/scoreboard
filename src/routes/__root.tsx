/// <reference types="vite/client" />
import { QueryClient } from "@tanstack/solid-query"
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
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
        ...[16, 32, 48, 64, 128, 256].map((size) => ({
          rel: "icon",
          type: "image/png",
          size: `${size}x${size}`,
          href: `/icons/icon-${size}.png`,
        })),
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
  return (
    <RootDocument>
      <Outlet />
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
