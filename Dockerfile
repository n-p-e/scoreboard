FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS install-prod
RUN mkdir -p /temp/dev/packages
COPY package.json bun.lock /temp/dev/
COPY packages/contract-dsl /temp/dev/packages/contract-dsl
RUN touch /temp/test.txt
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    cd /temp/dev && bun install --frozen-lockfile --prod

FROM install-prod AS install
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    cd /temp/dev && bun install --frozen-lockfile

FROM base AS builder
COPY --from=install /temp/dev/node_modules /app/node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install-prod /temp/dev/node_modules node_modules
COPY --from=builder /app/src src
COPY --from=builder /app/public public
COPY --from=builder /app/.output .output
COPY --from=builder /app/package.json /app/tsconfig.json /app/drizzle.config.ts ./

ENV NODE_ENV=production
# run the app
EXPOSE 3000/tcp
CMD [ "bun", "run", ".output/server/index.mjs" ]
