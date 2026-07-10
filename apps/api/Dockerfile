FROM node:20-slim AS base
WORKDIR /app
# Imagem Debian (não Alpine): evita incompatibilidades conhecidas entre o
# motor do Prisma e a musl libc/OpenSSL do Alpine. build-essential/python3
# são precisos para compilar dependências nativas (ex: argon2).
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 build-essential ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"]
