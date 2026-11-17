const mongoose = require("mongoose");

// Estructura de las etiquetas de producción (una etiqueta = una caja).
const etiquetaSchema = new mongoose.Schema({

    // Folio consecutivo visible para el usuario (1, 2, 3...).
    idEtiqueta: { type: Number, required: true, unique: true },

    // Pedido al que pertenece. De ahí salen cliente y producto.
    pedido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pedido",
        required: true
    },

    // Número de caja dentro del pedido.
    caja: { type: Number, required: true, min: 1 },

    // Piezas que contiene la caja.
    piezas: { type: Number, required: true, min: 1 },

    // Empleado que generó la etiqueta.
    empleado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empleado",
        required: true
    },

    fecha: { type: Date, default: Date.now }

}, {
    timestamps: true
});

// Validación: la caja no se repite dentro de un pedido.
// El índice único lo garantiza aunque dos operadores generen al mismo tiempo.
etiquetaSchema.index({ pedido: 1, caja: 1 }, { unique: true });

module.exports = mongoose.model("Etiqueta", etiquetaSchema);
