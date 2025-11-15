# Multi-stage Dockerfile for building and serving the Vite React app
# Stage 1: build the app
FROM node:18-alpine AS build

WORKDIR /app

# Allow passing the backend URL at build time so Vite can bake it into the bundle
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies based on package-lock if present, otherwise package.json
COPY package*.json ./
RUN npm ci --silent

# Copy source and build (Vite will read VITE_API_URL at build time)
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:stable-alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=build /app/dist /usr/share/nginx/html

# Use our nginx config (provides SPA fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
