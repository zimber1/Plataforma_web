# Build stage: build the frontend
FROM node:20 AS builder
WORKDIR /app

# Copy only frontend package files to leverage layer caching
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --no-audit --no-fund

# Copy frontend source and build
COPY frontend/ .
RUN npm run build

# Production stage: serve built static files with a lightweight server
FROM node:20-alpine AS runner
WORKDIR /app

# Install a simple static file server
RUN npm install -g serve@14

# Copy built files from builder
COPY --from=builder /app/frontend/dist ./dist

EXPOSE 3000

# Run the static server on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
