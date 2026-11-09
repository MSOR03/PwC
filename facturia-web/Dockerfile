FROM node:26-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# Runtime stage for serving the built application with Nginx
FROM nginx:alpine AS runtime
# Default proxy target for Docker Compose; override it on other platforms (e.g. Railway)
ENV API_UPSTREAM=http://api:3000
# The official image runs envsubst on /etc/nginx/templates/*.template at startup
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
