FROM node:18-alpine

WORKDIR /app
COPY . .

WORKDIR /app/billing-service

RUN npm install

EXPOSE 5004

# Run the service
CMD ["npm", "start"]