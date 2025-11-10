# ----- Build stage -----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Build (works for CRA or Vite depending on your project)
RUN npm run build

# ----- Serve stage -----
FROM nginx:alpine

# Pick which folder to copy; default to CRA's "build"
ARG BUILD_DIR=build
ENV BUILD_DIR=${BUILD_DIR}

# Copy the build output from the builder
COPY --from=build /app/dist /usr/share/nginx/html

# Optional SPA routing (uncomment if you use React Router)
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]