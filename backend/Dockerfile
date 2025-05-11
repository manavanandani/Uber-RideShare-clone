# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Remove development files
RUN rm -rf tests/ .git* .eslint* nodemon.json

# Final stage
FROM node:18-alpine

# Set production environment
ENV NODE_ENV=production

# Install curl for health checks
RUN apk --no-cache add curl

WORKDIR /app

# Copy from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app .

# Create directory for uploads if your app needs it
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]