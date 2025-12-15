# 1. build the app
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun run build

# 2. run the app
FROM oven/bun:1.3-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8000

ENTRYPOINT ["bun", "/app/dist/index.js"]
