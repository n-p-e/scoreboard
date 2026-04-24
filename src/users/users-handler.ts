import { zValidator } from "@hono/zod-validator"
import { CookieMap } from "bun"
import { Hono } from "hono"
import { HonoEnv } from "~/server/server-types"
import { userLogin } from "~/users/users-store"
import { UserLoginZ } from "./users-schema"

const usersHandler = new Hono<HonoEnv>()
  .post("/login", zValidator("json", UserLoginZ), async (ctx) => {
    const res = await userLogin(ctx.req.valid("json"))
    const cookies = new CookieMap()
    cookies.set("auth_token", res.token, {
      secure: import.meta.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 8 * 24 * 3600,
      sameSite: "strict",
      path: "/",
    })
    // set response header
    cookies.toSetCookieHeaders().forEach((value) => {
      ctx.res.headers.append("set-cookie", value)
    })
    return ctx.json(res)
  })

  .post("/logout", async (ctx) => {
    ctx.res.headers.set("set-cookie", "auth_token=; Max-Age=0; Path=/")
    return ctx.json({ status: "success" })
  })

  .get("/profile", async (ctx) => {
    //     body: {
    //   data: authStatus ?? { loggedIn: false },
    // },
    return ctx.json(ctx.var.auth)
  })

export { usersHandler }
