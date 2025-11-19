# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY .eslintrc.json ./
RUN npm ci

# Copy ALL source files
COPY src/ ./src/
COPY tests/ ./tests/
RUN npm test

# Production stage
FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# FIX: Copy public files from builder stage
COPY --from=builder /app/src/ ./src/

# Verify files
RUN ls -la /app/src/public/css/ && ls -la /app/src/public/js/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
