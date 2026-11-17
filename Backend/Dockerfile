
# Utilizamos Node.js para ejecutar el Backend.
FROM node:22-alpine

# Establecemos la carpeta de trabajo del contenedor.
WORKDIR /app

# Copiamos primero los archivos de dependencias.
COPY package*.json ./

# Instalamos las dependencias de producción.
RUN npm ci --omit=dev

# Copiamos el código del Backend.
COPY . .

# Documentamos el puerto utilizado por Express.
EXPOSE 3000

# Iniciamos el servidor.
CMD ["npm", "start"]
