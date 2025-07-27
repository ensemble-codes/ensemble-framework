# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy SDK package (dependency of API)
COPY packages/sdk/package.json packages/sdk/
COPY packages/sdk/src packages/sdk/src/
COPY packages/sdk/tsconfig.json packages/sdk/

# Copy API package
COPY packages/api/package.json packages/api/
COPY packages/api/src packages/api/src/
COPY packages/api/tsconfig.json packages/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build SDK first (API dependency)
WORKDIR /app/packages/sdk
RUN pnpm build

# Build API
WORKDIR /app/packages/api
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Create app directory and user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ensemble -u 1001

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY --chown=ensemble:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built SDK
COPY --chown=ensemble:nodejs --from=builder /app/packages/sdk/package.json ./packages/sdk/
COPY --chown=ensemble:nodejs --from=builder /app/packages/sdk/dist ./packages/sdk/dist/

# Copy built API
COPY --chown=ensemble:nodejs --from=builder /app/packages/api/package.json ./packages/api/
COPY --chown=ensemble:nodejs --from=builder /app/packages/api/dist ./packages/api/dist/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: process.env.PORT || 3000, path: '/health', method: 'GET' }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Switch to non-root user
USER ensemble

# Expose port
EXPOSE 3000

# Set working directory to API package
WORKDIR /app/packages/api

# Start the application
CMD ["node", "dist/index.js"]