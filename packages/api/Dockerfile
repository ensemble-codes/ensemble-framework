# Simple Dockerfile for API service with npm SDK dependency
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy pnpm-lock.yaml from repository root
# cp ../../pnpm-lock.yaml ./

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
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
    const options = { hostname: 'localhost', port: process.env.PORT || 8080, path: '/health', method: 'GET' }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]