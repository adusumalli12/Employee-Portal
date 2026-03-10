# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

# Install build tools for native dependencies like bcrypt
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the project (Backend and Frontend)
# This generates ./dist and ./frontend/dist
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

# Install runtime dependencies for native modules
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose application port
EXPOSE 3000

# Entry point
CMD ["npm", "run", "start"]
