FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Copy entire project (needed for monorepo structure)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the backend
WORKDIR /app/apps/backend
RUN mkdir -p prisma && touch prisma/dev.db
RUN pnpm run build

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "start"]
