FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Copy entire project (needed for monorepo structure)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the frontend
WORKDIR /app/apps/frontend
RUN pnpm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx (default CMD)
