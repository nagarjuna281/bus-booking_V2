# Stage 1: Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Conditionally copy tests if they exist
COPY tests/ ./tests/ 2>/dev/null || echo "⚠️ Tests directory not found, continuing..."

# Run tests only if tests directory exists
RUN if [ -d "/app/tests" ] && [ "$(ls -A /app/tests)" ]; then \
      echo "✅ Running tests..." && npm test; \
    else \
      echo "⚠️ No tests found, skipping test execution"; \
    fi

# Verify files are copied correctly
RUN echo "✅ Builder stage - Files copied:" && \
    ls -la /app/ && \
    echo "📁 Source files:" && \
    find /app/src/ -type f | head -10 && \
    echo "📁 Test files:" && \
    find /app/tests/ -type f 2>/dev/null | head -5 || echo "No test files found"

# Stage 2: Production stage  
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install PRODUCTION dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application from builder stage (excluding tests)
COPY --from=builder /app/src/ ./src/

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]
