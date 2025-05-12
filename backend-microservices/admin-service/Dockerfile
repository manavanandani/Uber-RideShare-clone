FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/admin-service

RUN npm install

EXPOSE 5001

CMD ["npm", "start"]

