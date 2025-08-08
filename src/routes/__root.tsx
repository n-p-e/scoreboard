/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Scripts } from "@tanstack/solid-router"
import type * as Solid from "solid-js"
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary"
import { NotFound } from "~/components/NotFound"
import appCss from "~/styles/app.css?url"

export const Route = createRootRoute({
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
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: Solid.JSX.Element }) {
  return (
    <>
      <HeadContent />
      {children}
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
      <Scripts />
    </>
  )
}
