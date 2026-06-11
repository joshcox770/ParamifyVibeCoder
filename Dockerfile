# --- Build Stage ---
FROM node:22-slim AS builder
WORKDIR /app

# Enable corepack for modern package manager pinning
RUN corepack enable

# Install ALL dependencies (including devDependencies for compiling)
COPY package*.json ./
RUN npm ci

# Copy source and run compilation (generates ./build/server and ./build/client)
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:22-slim AS runner
WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable

# Copy built bundles from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies to keep the image lightweight
RUN npm ci --omit=dev

# Expose the default port react-router-serve listens on
EXPOSE 3000

# Fire up the React Router Node server
CMD ["npm", "run", "start"]