# ---------- Build stage ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    
    RUN npx tsc
    
    # ---------- Runtime stage ----------
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY package*.json ./
    RUN npm ci --omit=dev
    
    COPY --from=builder /app/dist ./dist
    
    EXPOSE 3030
    
    CMD ["node", "dist/src/Api/server.js"]
    