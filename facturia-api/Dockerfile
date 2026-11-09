FROM node:26-alpine AS build
WORKDIR /app

#prisma.config.ts needs a database url to run prisma generate
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Copy TypeScript configuration and source files for building the application
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Runtime stage for the application
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files from the build stage to the runtime image
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
