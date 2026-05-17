import "~/server/server-only"
import "dotenv/config"
import { z } from "zod/mini"

export const ServerEnvZ = z.object({
  profile: z.enum(["development", "test", "production"]),
  databaseUrl: z.string(),
  apiBaseUrl: z.string(),
  tokenSignSecret: z.string().check(z.minLength(32)),
})

export const serverEnv = (() => {
  const parsedEnv = ServerEnvZ.parse({
    profile: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    apiBaseUrl: process.env.APP_API_BASE_URL ?? "http://localhost:3000/api",
    // generate with `head -c 32 /dev/random | basenc --base64url | tr -d "="`
    tokenSignSecret: process.env.APP_TOKEN_SIGN_SECRET,
  })

  if (parsedEnv.profile === "test") {
    return {
      ...parsedEnv,
      databaseUrl: process.env.TEST_DATABASE_URL as string,
    }
  }

  return parsedEnv
})()
