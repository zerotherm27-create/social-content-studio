FROM node:22-slim AS base

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json ./
COPY apps/web/prisma ./prisma
RUN npm ci

FROM base AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./
RUN npm run build

FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3001

CMD ["npm", "run", "start:railway"]
