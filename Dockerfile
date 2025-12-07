# Use Node 18 with OpenSSL pre-installed to fix the Prisma warning
FROM node:18-slim

# Install OpenSSL libraries for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# 1. FIRST, copy ONLY package files for efficient dependency installation
COPY backend/package*.json ./

# 2. Install dependencies (this step is cached if package.json doesn't change)
RUN npm install

# 3. NOW, copy the rest of the backend application code
COPY backend/ ./

# 4. Generate Prisma Client
RUN npx prisma generate

# 5. THE KEY FIX: Use the PORT provided by Railway and DO NOT copy local .env
CMD ["node", "server.js"]