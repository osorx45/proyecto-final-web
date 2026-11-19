const mongoose = require("mongoose");

const ESTATUS = ["No iniciado", "En progreso", "Terminado"];

// Estructura de los pedidos (RF-13).
// Cada documento es un renglón del archivo importado: un pedido con un producto.
// Un mismo número de pedido puede tener varios productos (un documento por cada uno).
const pedidoSchema = new mongoose.Schema({

    numeroPedido: { type: String, required: true, trim: true },

    // Número del cliente según el archivo importado (columna id_cliente).
    idCliente: { type: String, trim: true, default: "" },

    cliente: { type: String, required: true, trim: true },

    producto: { type: String, required: true, trim: true },

    // Total de piezas solicitadas.
    cantidad: { type: Number, required: true, min: 1 },

    // Piezas que caben en cada caja.
    piezasPorCaja: { type: Number, required: true, min: 1 },

    // Etiquetas (cajas) necesarias. Se calcula al importar (RF-22).
    numeroCajas: { type: Number, required: true, min: 1 },

    // Etiquetas que ya se generaron. Lo actualiza etiquetaService.
    cajasGeneradas: { type: Number, default: 0, min: 0 },

    estatus: { type: String, enum: ESTATUS, default: "No iniciado" },

    fecha: { type: Date, default: Date.now }

}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// No se puede repetir el mismo producto dentro del mismo pedido.
pedidoSchema.index({ numeroPedido: 1, producto: 1 }, { unique: true });

// Porcentaje de avance: cajas generadas contra cajas necesarias.
pedidoSchema.virtual("porcentaje").get(function () {
    if (!this.numeroCajas) return 0;
    return Math.round((this.cajasGeneradas / this.numeroCajas) * 100);
});

module.exports = mongoose.model("Pedido", pedidoSchema);
module.exports.ESTATUS = ESTATUS;
