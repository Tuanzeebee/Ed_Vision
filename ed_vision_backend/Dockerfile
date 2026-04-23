FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

FROM deps AS builder

WORKDIR /app

COPY . .

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
