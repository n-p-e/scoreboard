import "~/server/server-only"

import "dotenv/config"

export const serverEnv = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL as string,
  apiBaseUrl:
    (process.env.APP_API_BASE_URL as string) ?? "http://localhost:3000/api",
  // generate with `head -c 32 /dev/random | basenc --base64url | tr -d "="`
  tokenSignSecret: process.env.APP_TOKEN_SIGN_SECRET as string,
}
