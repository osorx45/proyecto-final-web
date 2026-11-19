# BIC — Backend

API REST del sistema de control de etiquetas. Node.js 22, Express 5, MongoDB con Mongoose.

## Correr

```bash
cp .env.example .env     # llena los valores
npm install
npm run seed:admin       # crea el primer administrador
npm run dev              # desarrollo, con reinicio automático
npm start                # producción
```

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Inicia el servidor con nodemon |
| `npm start` | Inicia el servidor |
| `npm run seed:admin` | Crea el administrador con `ADMIN_NUMERO` y `ADMIN_PASSWORD` |

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto de Express (3000) |
| `MONGO_URI` | Conexión a MongoDB (local o Atlas) |
| `JWT_SECRET` | Clave para firmar los tokens JWT |
| `CLIENT_URL` | Origen permitido por CORS (dirección del Frontend) |
| `ADMIN_NUMERO`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Datos del primer administrador |
| `FIREBASE_PROJECT_ID` | Opcional. Activa el inicio con Google |
| `ZONA_HORARIA` | Opcional. Zona de las fechas impresas (America/Mexico_City) |

## Estructura

```
src/
  server.js        Arranque: seguridad, CORS, rutas y manejo de errores
  config/          Conexión a MongoDB, Firebase y constantes del sistema
  models/          Empleado, Pedido, Producto, Etiqueta, Historial, Contador
  middleware/      verificarToken / verificarRol (JWT) y manejo de errores
  routes/          Qué dirección llama a qué controlador y con qué rol
  controllers/     Reciben la petición, validan y responden
  services/        Reglas de etiquetas, generación de PDF y Excel
  utils/           Formato de importación, fechas, script del administrador
```

## Rutas

Todas (excepto login y health) requieren `Authorization: Bearer <token>`.

| Método y ruta | Rol | Descripción |
| --- | --- | --- |
| `POST /api/auth/login` | — | Número de empleado y contraseña → JWT |
| `POST /api/auth/google` | — | Token de Firebase (Google) → JWT |
| `GET /api/auth/perfil` | cualquiera | Usuario del token |
| `GET/POST /api/empleados`, `PUT/DELETE /api/empleados/:id` | Administrador | Empleados |
| `GET /api/pedidos` | Administrador | Lista de pedidos |
| `POST /api/pedidos/importar` | Administrador | Importa Excel/CSV (campo `archivo`) |
| `GET /api/pedidos/plantilla` | Administrador | Plantilla de ejemplo |
| `DELETE /api/pedidos/:id` | Administrador | Solo si está "No iniciado" |
| `GET /api/pedidos/opciones` | cualquiera | Pedidos para las listas desplegables |
| `GET /api/etiquetas` | cualquiera | Admin: todas. Operador: las suyas |
| `POST /api/etiquetas/vista-previa` | Operador | PDF de la siguiente etiqueta, sin guardar |
| `POST /api/etiquetas` | Operador | Genera y guarda la etiqueta |
| `GET /api/etiquetas/:id/pdf` | cualquiera | PDF (`?reimprimir=1` lo registra) |
| `PUT /api/etiquetas/:id` | cualquiera | Cambia el pedido/cliente/producto |
| `DELETE /api/etiquetas/:id` | Operador | Solo propias y del turno actual |
| `GET /api/etiquetas/:id/historial` | cualquiera | Bitácora de la etiqueta |
| `GET /api/etiquetas/exportar` | Administrador | Excel de etiquetas |
| `GET /api/etiquetas/reporte-turno` | Operador | PDF del turno |

## Reglas principales

- Al importar: `numeroCajas = ceil(cantidad / piezasPorCaja)`. No se generan más etiquetas que esas.
- La caja es el número libre más bajo del pedido; la última caja lleva las piezas sobrantes.
- Estatus del pedido: sin etiquetas "No iniciado", con algunas "En progreso", con todas "Terminado".
- "Turno actual" = últimas 8 horas (`HORAS_TURNO` en `src/config/constantes.js`), igual que la vigencia del JWT.
- Contraseñas cifradas con bcrypt.
