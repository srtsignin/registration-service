FROM node:8.12.0-alpine

WORKDIR /

COPY . .

EXPOSE 3002

CMD node registration-service.js