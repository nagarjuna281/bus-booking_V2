# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY .eslintrc.json ./

# Install all dependencies including dev
RUN npm ci

COPY src/ ./src/
COPY tests/ ./tests/

# Run tests (optional - in CI you might do this separately)
RUN npm test

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
