FROM node:18-alpine

WORKDIR /app
COPY . .

WORKDIR /app/customer-service

RUN npm install

EXPOSE 5002

# Run the service
CMD ["npm", "start"]