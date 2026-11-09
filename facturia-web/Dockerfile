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
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
