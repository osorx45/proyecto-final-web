const mongoose = require("mongoose");

// Bitácora de etiquetas (RF-21): quién y cuándo edita, reimprime o elimina.
// Se guarda una copia de los datos para conservarlos aunque la etiqueta se borre.
const historialSchema = new mongoose.Schema({

    accion: {
        type: String,
        enum: ["Generar", "Editar", "Reimprimir", "Eliminar"],
        required: true
    },

    idEtiqueta: { type: Number, required: true, index: true },

    // Texto corto con lo que pasó (ej. "Pedido 1 caja 3 → Pedido 2 caja 1").
    detalle: { type: String, default: "" },

    // Datos del empleado que hizo la acción.
    numeroEmpleado: { type: Number, required: true },
    nombreEmpleado: { type: String, required: true },

    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Historial", historialSchema);
