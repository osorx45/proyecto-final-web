# BIC — Frontend

Interfaz del sistema de control de etiquetas. React 19, Vite y React Router.

## Correr

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev              # http://localhost:5173
npm run build            # genera la carpeta dist/ para producción
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | Dirección de la API, terminando en `/api` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Opcionales. Activan el botón "Entrar con Google" |

Vite inserta estas variables al compilar: si cambian hay que volver a compilar.

## Estructura

```
src/
  App.jsx            Rutas de la aplicación y pantalla permitida por rol
  context/           AuthContext: sesión (token JWT y usuario) en sessionStorage
  services/          api.js (peticiones con token), authService.js, firebase.js
  hooks/             useDatos: carga una lista de la API
  components/        Layout (encabezado y menú), TablaDatos (filtro, orden,
                     paginación), Modal, SelectorPedido, ModalesEtiqueta
  pages/             Login, GenerarEtiqueta, Reimpresiones (Operador)
                     Pedidos, Empleados, Etiquetas (Administrador)
  utils/             Imprimir PDF, descargar archivos, formato de fechas
```

## Pantallas

| Ruta | Rol | Pantalla |
| --- | --- | --- |
| `/login` | — | Inicio de sesión |
| `/generar` | Operador | Generar etiqueta |
| `/reimpresiones` | Operador | Reimpresiones y reporte del turno |
| `/pedidos` | Administrador | Importar y dar seguimiento a pedidos |
| `/empleados` | Administrador | Agregar, editar y eliminar empleados |
| `/etiquetas` | Administrador | Todas las etiquetas y descarga en Excel |
