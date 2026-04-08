FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

# run both app + logger
CMD ["sh", "-c", "node logger.js & npm run dev"]