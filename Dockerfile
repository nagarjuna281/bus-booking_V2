# Stage 1: Builder (runs as root for builds)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY tests/ ./tests/
RUN npm test

# Stage 2: Production (runs as non-root)
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install as root (required for npm)
RUN npm ci --only=production

# Copy app from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/src/ ./src/

# Switch to non-root user
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
