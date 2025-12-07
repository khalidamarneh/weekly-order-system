# Use Node 18 with OpenSSL pre-installed
FROM node:18-slim

# Install OpenSSL libraries for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# 1. Copy everything
COPY . .

# 2. Install and build frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 3. Install backend
WORKDIR /app/backend
RUN npm install
RUN npx prisma generate

# 4. Go back to backend directory for runtime
WORKDIR /app/backend

# 5. Create uploads directory
RUN mkdir -p uploads/images

# 6. Start the server
CMD ["node", "server.js"]