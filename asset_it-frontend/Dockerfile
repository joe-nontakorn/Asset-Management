# Build Stage
FROM oven/bun:1.1-slim AS build
WORKDIR /app
COPY package.json ./
RUN bun install
COPY .env ./
COPY . .
RUN bun run build

# Production Stage
FROM nginx:stable-alpine
# Copy ไฟล์ที่ build เสร็จจาก /app/dist ไปยัง nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copy config สำหรับจัดการ routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]