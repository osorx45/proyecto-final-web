// Cargamos las variables del archivo .env.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const conectarDB = require("./config/database");
const { googleActivo } = require("./config/firebase");
const { rutaNoEncontrada, manejarErrores } = require("./middleware/errores");

const authRoutes = require("./routes/authRoutes");
const empleadoRoutes = require("./routes/empleadoRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const etiquetaRoutes = require("./routes/etiquetaRoutes");

const app = express();

// En producción las peticiones llegan a través de Nginx (un proxy).
// Esto permite conocer la IP real del visitante para el límite de intentos.
app.set("trust proxy", 1);

// Encabezados básicos de seguridad.
app.use(helmet());

// CORS: solo el Frontend indicado en CLIENT_URL puede llamar a la API.
// Se pueden poner varios orígenes separados por coma.
const origenesPermitidos = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);

app.use(cors({
    origin: origenesPermitidos,
    // Deja que el navegador lea el nombre de los archivos descargados.
    exposedHeaders: ["Content-Disposition"]
}));

// Permite recibir información en formato JSON.
app.use(express.json({ limit: "1mb" }));

// Rutas de la API.
app.use("/api/auth", authRoutes);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/etiquetas", etiquetaRoutes);

// Ruta principal para comprobar que el servidor funciona.
app.get("/", (req, res) => {
    res.json({ mensaje: "Servidor BIC funcionando correctamente." });
});

// Ruta de comprobación. El Frontend también la usa para saber
// si debe mostrar el botón "Entrar con Google".
app.get("/api/health", (req, res) => {
    res.json({
        estado: "correcto",
        aplicacion: "BIC",
        baseDeDatos: "MongoDB",
        google: googleActivo()
    });
});

// Deben ir al final: ruta inexistente y manejador de errores.
app.use(rutaNoEncontrada);
app.use(manejarErrores);

// Conecta primero la base de datos y después inicia el servidor,
// para no aceptar peticiones sin conexión.
const iniciarServidor = async () => {
    try {
        if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
            throw new Error("Faltan MONGO_URI o JWT_SECRET en el archivo .env.");
        }

        await conectarDB();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Servidor BIC activo en puerto ${PORT}.`);
            console.log(`API disponible en http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor BIC:", error.message);
        process.exit(1);
    }
};

iniciarServidor();
