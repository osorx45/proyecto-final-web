const mongoose = require("mongoose");

// Turnos y roles válidos. Se exportan para reutilizarlos en las validaciones.
const TURNOS = ["Matutino", "Vespertino", "Nocturno"];
const ROLES = ["Administrador", "Operador"];

// Estructura de los empleados (RF-16).
const empleadoSchema = new mongoose.Schema({

    // Número con el que el empleado inicia sesión (RF-01).
    numeroEmpleado: {
        type: Number,
        required: true,
        unique: true,
        min: 1
    },

    nombre: { type: String, required: true, trim: true },

    apellido: { type: String, trim: true, default: "" },

    turno: { type: String, enum: TURNOS, default: "Matutino" },

    // Correo de Google (opcional). Solo se usa para "Entrar con Google".
    // "sparse" permite que varios empleados no tengan correo.
    correo: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },

    // Contraseña cifrada con bcrypt (RNF-05). Nunca se guarda en texto plano.
    password: { type: String, required: true },

    rol: { type: String, enum: ROLES, required: true, default: "Operador" },

    activo: { type: Boolean, default: true }

}, {
    timestamps: true
});

module.exports = mongoose.model("Empleado", empleadoSchema);
module.exports.TURNOS = TURNOS;
module.exports.ROLES = ROLES;
