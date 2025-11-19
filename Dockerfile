# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .eslintrc.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/

# Run tests and generate coverage
RUN npm test

# Verify static files are present
RUN echo "✅ Verifying static files:" && \
    ls -la /app/src/public/ && \
    ls -la /app/src/public/css/ && \
    ls -la /app/src/public/js/ && \
    echo "✅ Static files verified"

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application from builder stage
COPY --from=builder /app/src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["npm", "start"]
