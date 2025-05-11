# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install production

# Copy application code
COPY . .

# Prune dev dependencies and remove unnecessary files
RUN npm prune --production && \
    rm -rf tests/ .git* .eslint* nodemon.json

# Final stage
FROM node:18-alpine

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/config ./config
COPY --from=build /app/controllers ./controllers
COPY --from=build /app/middleware ./middleware
COPY --from=build /app/models ./models
COPY --from=build /app/routes ./routes
COPY --from=build /app/services ./services
COPY --from=build /app/utils ./utils
COPY --from=build /app/FastAPI ./FastAPI
COPY --from=build /app/app.js ./app.js
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json ./package.json

# Create directory for uploads if your app needs it
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]