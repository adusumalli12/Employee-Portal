# STAGE 1: Build & Compile
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (bcryptjs doesn't need C++ tools)
COPY package*.json ./
RUN npm install

# Copy source and build (Backend + Frontend)
COPY . .
RUN npm run build

# STAGE 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy only the compiled artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose the API/Frontend port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
