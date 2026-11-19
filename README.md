# Empresa BIC control de etiquetas

Sistema web para generar, guardar e imprimir etiquetas de producción por caja
(operador) y administrar pedidos, empleados y el registro de etiquetas (administrador).

| Carpeta | Contenido |
| --- | --- |
| `Backend/` | API en Node.js + Express + MongoDB (Mongoose). Ver [Backend/README.md](Backend/README.md) |
| `Frontend/` | Aplicación en React + Vite. Ver [Frontend/README.md](Frontend/README.md) |
| `nginx/` | Configuración del proxy que reparte las peticiones por subdominio |
| `database/`, `docker-compose.dev.yml` | MongoDB local en Docker para desarrollo |
| `docker-compose.yml` | Despliegue de producción (proxy + frontend + backend) |
| `docker-compose.local.yml` | Agrega MongoDB local para probar la producción en tu computadora |
| `ejemplos/` | Archivo de pedidos de ejemplo para importar |

## Funciones

**Operador:** generar etiqueta (cliente → pedido → producto, caja y piezas automáticas,
vista previa en PDF, guardar e imprimir con un botón), reimpresiones (reimprimir, ver,
editar, eliminar las de su turno) y reporte del turno en PDF.

**Administrador:** importar pedidos desde Excel/CSV, seguimiento con estatus y porcentaje,
alta/edición/baja de empleados, consulta de todas las etiquetas con su historial y
descarga en Excel.

Inicio de sesión con número de empleado y contraseña (JWT) y, opcionalmente,
con Google (Firebase) combinado con JWT.

## Correr en tu computadora (desarrollo)

Requisitos: Node.js 22 y una base MongoDB (Docker local o MongoDB Atlas).

```bash
# 1. Base de datos local (opcional si usas Atlas). Requiere el archivo .env de esta carpeta.
docker compose -f docker-compose.dev.yml up -d

# 2. Backend
cd Backend
cp .env.example .env        # llena MONGO_URI, JWT_SECRET y ADMIN_PASSWORD
npm install
npm run seed:admin          # crea el administrador (número de empleado 1)
npm run dev                 # http://localhost:3000

# 3. Frontend (en otra terminal)
cd Frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Entra con el número de empleado `1` y la contraseña de `ADMIN_PASSWORD`.
Importa `ejemplos/pedidos_ejemplo.csv` en la pantalla Pedidos y crea un operador
en Empleados para probar la generación de etiquetas.

## Probar la versión de producción en tu computadora

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Abre `http://bic.localhost` (la API queda en `http://api.bic.localhost/api/health`).
Usa los valores de prueba del `.env` de esta carpeta y el mismo MongoDB local de desarrollo.

## Desplegar en producción (AWS EC2 + Docker Compose)

Arquitectura: Cloudflare → EC2 (Nginx proxy → contenedores frontend y backend) → MongoDB Atlas.

```bash
cp .env.example .env        # llena dominios, MONGO_URI, JWT_SECRET, ADMIN_PASSWORD
docker compose up -d --build
docker compose exec backend npm run seed:admin
```

- `https://FRONTEND_DOMAIN` muestra la aplicación.
- `https://BACKEND_DOMAIN/api/health` comprueba la API.

## Formato del archivo de pedidos

> **Provisional.** Se ajustará cuando se entregue la estructura oficial.
> Todo lo relacionado está en `Backend/src/utils/formatoImportacion.js`.

| pedido | cliente | producto | cantidad | piezas_por_caja | fecha |
| --- | --- | --- | --- | --- | --- |
| 1 | cliente 1 | azul | 1000 | 50 | 12/05/2025 |

`piezas_por_caja` y `fecha` son opcionales (por defecto 50 piezas y la fecha de hoy).
Las etiquetas necesarias se calculan como `cantidad ÷ piezas_por_caja` redondeado hacia arriba.
