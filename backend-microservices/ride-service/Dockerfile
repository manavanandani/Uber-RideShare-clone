FROM node:18-alpine

WORKDIR /app
COPY . .

WORKDIR /app/ride-service

RUN npm install

EXPOSE 5005

# Run the service
CMD ["npm", "start"]