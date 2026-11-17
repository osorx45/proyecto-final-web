const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Empleado = require("../models/Empleado");
const ErrorApp = require("../utils/ErrorApp");
const { HORAS_TURNO } = require("../config/constantes");
const { googleActivo, verificarTokenGoogle } = require("../config/firebase");

// Arma la respuesta de un inicio de sesión correcto: el JWT propio del
// sistema y los datos que el Frontend muestra en el menú (RF-03).
const responderSesion = (res, empleado) => {
    const token = jwt.sign(
        { id: empleado._id, rol: empleado.rol },
        process.env.JWT_SECRET,
        { expiresIn: `${HORAS_TURNO}h` }
    );

    res.json({
        mensaje: "Inicio de sesión correcto.",
        token,
        usuario: {
            id: empleado._id,
            numeroEmpleado: empleado.numeroEmpleado,
            nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
            turno: empleado.turno,
            rol: empleado.rol
        }
    });
};

// POST /api/auth/login — número de empleado y contraseña (RF-01).
const iniciarSesion = async (req, res) => {
    const { numeroEmpleado, password } = req.body || {};

    if (!numeroEmpleado || !password) {
        throw new ErrorApp(400, "Debes ingresar número de empleado y contraseña.");
    }

    const numero = Number(numeroEmpleado);
    const empleado = Number.isInteger(numero)
        ? await Empleado.findOne({ numeroEmpleado: numero })
        : null;

    // Mismo mensaje si falla el número o la contraseña,
    // para no revelar qué números de empleado existen.
    const passwordValido = empleado && empleado.activo
        && await bcrypt.compare(String(password), empleado.password);

    if (!passwordValido) {
        throw new ErrorApp(401, "Número de empleado o contraseña incorrectos.");
    }

    responderSesion(res, empleado);
};

// POST /api/auth/google — inicio con Google (Firebase) combinado con JWT.
// 1) El Frontend inicia sesión con Google y nos manda el token de Firebase.
// 2) Aquí verificamos ese token con Google.
// 3) Si el correo pertenece a un empleado, entregamos nuestro propio JWT.
const iniciarSesionGoogle = async (req, res) => {
    if (!googleActivo()) {
        throw new ErrorApp(503, "El inicio con Google no está configurado.");
    }

    const { idToken } = req.body || {};
    if (!idToken) throw new ErrorApp(400, "Falta el token de Google.");

    let cuenta;
    try {
        cuenta = await verificarTokenGoogle(idToken);
    } catch (error) {
        throw new ErrorApp(401, "No se pudo verificar la cuenta de Google.");
    }

    if (!cuenta.email || !cuenta.email_verified) {
        throw new ErrorApp(401, "La cuenta de Google no tiene un correo verificado.");
    }

    // Solo entran los correos que el administrador registró en Empleados.
    const empleado = await Empleado.findOne({ correo: cuenta.email.toLowerCase() });

    if (!empleado || !empleado.activo) {
        throw new ErrorApp(403, "Ese correo de Google no está registrado para ningún empleado.");
    }

    responderSesion(res, empleado);
};

// GET /api/auth/perfil — devuelve el usuario del token (sirve para probar el JWT).
const obtenerPerfil = (req, res) => {
    res.json({ usuario: req.usuario });
};

module.exports = { iniciarSesion, iniciarSesionGoogle, obtenerPerfil };
