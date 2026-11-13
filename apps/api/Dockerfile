# Build context is the repository root (pnpm workspace):
#   docker build -f apps/api/Dockerfile -t salary-api .

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

FROM base AS build
RUN pnpm install --frozen-lockfile --filter @salary/api
COPY apps/api apps/api
RUN pnpm --filter @salary/api build

FROM base AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000 \
    DATABASE_PATH=/data/salary.db
RUN pnpm install --frozen-lockfile --prod --filter @salary/api
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
WORKDIR /app/apps/api
EXPOSE 4000
# Migrates, seeds 10k employees only if the database is empty, then serves.
CMD ["pnpm", "start:prod"]
