# --- Build Stage ---
FROM node:22.14-slim AS builder
WORKDIR /app

# Enable corepack for modern package management
RUN corepack enable

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build the React Router app
COPY . .
RUN npm run build

# --- Production Stage ---
FROM nginx:alpine AS runner
# React Router v7 outputs static client builds to build/client
COPY --from=builder /app/build/client /usr/share/nginx/html

# Adjust Nginx to handle React Router single-page application routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]