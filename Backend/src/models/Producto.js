const mongoose = require("mongoose");

// Catálogo de productos (nombre o color: azul, negra, roja...).
// No tiene pantalla propia: se llena al importar los pedidos.
const productoSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Producto", productoSchema);
