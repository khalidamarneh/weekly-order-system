# ========== STAGE 1: Build Frontend ==========
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ========== STAGE 2: Build Backend ==========
FROM node:18-slim
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy and setup backend
COPY backend/ ./
RUN npm install
RUN npx prisma generate
RUN mkdir -p uploads/images

CMD ["node", "server.js"]