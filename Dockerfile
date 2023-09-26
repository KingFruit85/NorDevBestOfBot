# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /nordevbestofbot
COPY . .
RUN yarn install --production
CMD ["node", "./handler/index.js"]
EXPOSE 3000