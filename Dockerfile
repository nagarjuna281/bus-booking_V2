FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
