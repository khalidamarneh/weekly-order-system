FROM node:18-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npx prisma generate
CMD ["node", "server.js"]