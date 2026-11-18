# Imagen del front (Next.js): se compila en una etapa y se corre con `next start` en otra.
FROM node:24-alpine AS build

WORKDIR /app

# Las rewrites de next.config (/api/* -> API_URL) quedan fijas al compilar, por eso API_URL es un argumento de build
ARG API_URL=http://localhost:3000
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:24-alpine

WORKDIR /app

ARG API_URL=http://localhost:3000
ENV API_URL=$API_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.mjs ./
COPY --from=build /app/scripts ./scripts

EXPOSE 3001

CMD ["npm", "start"]
