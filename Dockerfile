# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY data ./data
COPY vite.config.ts ./vite.config.ts
COPY theme.json ./theme.json
COPY tsconfig.json ./tsconfig.json
COPY postcss.config.js ./postcss.config.js
COPY tailwind.config.ts ./tailwind.config.ts
RUN npm install --legacy-peer-deps
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
COPY --from=build /app/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
