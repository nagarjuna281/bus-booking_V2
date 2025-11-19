# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Stage 2: Run  
FROM node:18-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --only=production
COPY --from=build /app/src ./src

EXPOSE 3000
CMD ["npm", "start"]
