FROM node:22-alpine
WORKDIR /app

ADD dist /app/

CMD ["node", "index.js"]
