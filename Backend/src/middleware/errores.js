// Respuesta para rutas que no existen.
const rutaNoEncontrada = (req, res) => {
    res.status(404).json({ mensaje: "La ruta solicitada no existe." });
};

// Manejador central de errores. Express 5 envía aquí cualquier error
// lanzado dentro de un controlador (también los asíncronos).
// eslint-disable-next-line no-unused-vars
const manejarErrores = (error, req, res, next) => {

    // Errores lanzados a propósito con ErrorApp(status, mensaje).
    if (error.status) {
        return res.status(error.status).json({ mensaje: error.message });
    }

    // Datos que no cumplen las reglas del modelo de Mongoose.
    if (error.name === "ValidationError") {
        const mensajes = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ mensaje: `Datos no válidos: ${mensajes.join(" ")}` });
    }

    // Id con formato incorrecto en la URL.
    if (error.name === "CastError") {
        return res.status(400).json({ mensaje: "El identificador no es válido." });
    }

    // Valor repetido en un campo único.
    if (error.code === 11000) {
        return res.status(409).json({ mensaje: "Ya existe un registro con esos datos." });
    }

    // Archivo demasiado grande u otro problema al subirlo.
    if (error.name === "MulterError") {
        return res.status(400).json({ mensaje: "No se pudo recibir el archivo (máximo 5 MB)." });
    }

    console.error("Error no controlado:", error);
    res.status(500).json({ mensaje: "Ocurrió un error en el servidor." });
};

module.exports = { rutaNoEncontrada, manejarErrores };
