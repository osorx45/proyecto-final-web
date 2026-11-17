const mongoose = require("mongoose");

// Cargamos los modelos para poder sincronizar sus índices.
require("../models/Empleado");
require("../models/Producto");
require("../models/Pedido");
require("../models/Etiqueta");
require("../models/Historial");
require("../models/Contador");

// Conecta el Backend con MongoDB usando la URI del archivo .env.
// En desarrollo puede ser el Mongo local; en producción es MongoDB Atlas.
const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB conectado correctamente.");

        // Dejamos los índices de la base igual que los definidos en los modelos
        // (crea los nuevos y borra los de versiones anteriores del proyecto).
        await Promise.all(
            Object.values(mongoose.models).map((modelo) => modelo.syncIndexes())
        );
    } catch (error) {
        console.error("Error al conectar con MongoDB:", error.message);
        throw error;
    }
};

module.exports = conectarDB;
