const mongoose = require("mongoose");

// Contadores consecutivos. Se usa para el folio de las etiquetas (idEtiqueta).
const contadorSchema = new mongoose.Schema({
    _id: { type: String },
    valor: { type: Number, default: 0 }
});

// Devuelve el siguiente número del contador indicado (1, 2, 3...).
// $inc es atómico: dos peticiones simultáneas nunca reciben el mismo número.
contadorSchema.statics.siguiente = async function (nombre) {
    const contador = await this.findOneAndUpdate(
        { _id: nombre },
        { $inc: { valor: 1 } },
        { returnDocument: "after", upsert: true }
    );
    return contador.valor;
};

module.exports = mongoose.model("Contador", contadorSchema);
