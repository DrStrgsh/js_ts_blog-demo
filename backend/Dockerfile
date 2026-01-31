FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/main.ts"]
