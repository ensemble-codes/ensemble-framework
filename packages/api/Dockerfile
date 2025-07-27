# AppRunner-specific Dockerfile that works with source directory: packages/api
FROM node:18-alpine

# Set working directory to the repository root (AppRunner mounts the source)
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files from repository root
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# Copy SDK package (dependency of API)
COPY ../../packages/sdk ./packages/sdk/

# Copy API package (current source directory)  
COPY . ./packages/api/

# Install dependencies from root
RUN pnpm install --frozen-lockfile

# Build SDK first (required dependency)
WORKDIR /app/packages/sdk
RUN pnpm build

# Build API
WORKDIR /app/packages/api
RUN pnpm build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ensemble -u 1001

# Set production environment
ENV NODE_ENV=production

# Change ownership of the app directory
RUN chown -R ensemble:nodejs /app

# Switch to non-root user
USER ensemble

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: process.env.PORT || 3000, path: '/health', method: 'GET' }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]