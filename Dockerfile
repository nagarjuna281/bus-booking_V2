# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Final stage
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package*.json ./

# Copy only necessary directories/files explicitly
COPY --chown=nextjs:nodejs src/ ./src/
COPY --chown=nextjs:nodejs public/ ./public/
COPY --chown=nextjs:nodejs dist/ ./dist/
COPY --chown=nextjs:nodejs *.js ./
COPY --chown=nextjs:nodejs *.json ./

USER nextjs

CMD ["npm", "start"]
