# ---------- Etapa 1: compilar React ----------
FROM node:22-alpine AS compilacion

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite "graba" estas variables dentro del JavaScript al compilar,
# por eso se reciben aquí (las manda docker-compose.yml) y no al ejecutar.
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID

RUN npm run build

# ---------- Etapa 2: servir los archivos con Nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist /usr/share/nginx/html

EXPOSE 80
