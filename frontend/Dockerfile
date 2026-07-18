# Stage 1: Build the application
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (to leverage Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code and build
COPY . .
# We use VITE_API_URL in production, which can be injected at build time,
# but usually in Dockerized Vite apps, the API URL is either relative (e.g. /api)
# or provided via environment variable. 
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
