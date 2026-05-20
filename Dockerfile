FROM oven/bun:1-alpine AS base
WORKDIR /work

FROM base AS install-prod
WORKDIR /work
COPY package.json bun.lock ./
COPY pkg/contract-dsl/package.json ./pkg/contract-dsl/package.json
COPY pkg/app/package.json ./pkg/app/package.json

# skip installing vite (peer dependency of tanstack start) in prod
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --prod --omit=peer --filter=./pkg/app

FROM install-prod AS install-full
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM base AS builder
COPY --from=install-full /work/node_modules /work/node_modules
COPY --from=install-full /work/pkg/app/node_modules /work/pkg/app/node_modules
COPY --from=install-full /work/pkg/contract-dsl/node_modules /work/pkg/contract-dsl/node_modules
COPY . .
ENV NODE_ENV=production
RUN cd pkg/app && bun run build

# copy production dependencies and source code into final image
FROM base AS release
WORKDIR /work/pkg/app
COPY --from=install-prod /work/node_modules /work/node_modules
COPY --from=install-prod /work/pkg/app/node_modules node_modules
COPY --from=builder /work/pkg/app/src src
COPY --from=builder /work/pkg/app/public public
COPY --from=builder /work/pkg/app/.output .output
COPY --from=builder /work/pkg/app/package.json \
    /work/pkg/app/tsconfig.json \
    /work/pkg/app/drizzle.config.ts ./

ENV NODE_ENV=production
# run the app
EXPOSE 3000/tcp
CMD [ "bun", "run", ".output/server/index.mjs" ]
