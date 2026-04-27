FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY packages/contract-dsl /temp/dev/packages/contract-dsl
RUN cd /temp/dev && bun install --frozen-lockfile

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules /app/node_modules
COPY packages/contract-dsl /temp/dev/packages/contract-dsl
COPY . .
ENV NODE_ENV=production
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=prerelease /app/src src
COPY --from=prerelease /app/public public
COPY --from=prerelease /app/.output .output
COPY --from=prerelease /app/package.json /app/tsconfig.json /app/drizzle.config.ts ./

ENV NODE_ENV=production
# run the app
USER bun
EXPOSE 3000/tcp
CMD [ "bun", "run", ".output/server/index.mjs" ]
