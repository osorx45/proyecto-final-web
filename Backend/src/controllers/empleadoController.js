const bcrypt = require("bcrypt");

const Empleado = require("../models/Empleado");
const { TURNOS, ROLES } = require("../models/Empleado");
const ErrorApp = require("../utils/ErrorApp");

// Revisa y limpia los datos del formulario de empleados.
// "esNuevo" indica si la contraseña es obligatoria (al editar es opcional).
const validarDatos = async (body, esNuevo) => {
    const numeroEmpleado = Number(body.numeroEmpleado);
    const nombre = String(body.nombre || "").trim();
    const apellido = String(body.apellido || "").trim();
    const correo = String(body.correo || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!Number.isInteger(numeroEmpleado) || numeroEmpleado < 1) {
        throw new ErrorApp(400, "El número de empleado debe ser un entero mayor que cero.");
    }
    if (!nombre || !apellido) throw new ErrorApp(400, "Nombre y apellido son obligatorios.");
    if (!TURNOS.includes(body.turno)) throw new ErrorApp(400, "El turno no es válido.");
    if (!ROLES.includes(body.rol)) throw new ErrorApp(400, "El rol no es válido.");
    if (correo && !/^\S+@\S+\.\S+$/.test(correo)) throw new ErrorApp(400, "El correo no es válido.");
    if (esNuevo && !password) throw new ErrorApp(400, "La contraseña es obligatoria.");
    if (password && password.length < 6) {
        throw new ErrorApp(400, "La contraseña debe tener al menos 6 caracteres.");
    }

    const datos = { numeroEmpleado, nombre, apellido, turno: body.turno, rol: body.rol };

    // undefined (y no "") para que el índice único de correo ignore a quien no tiene.
    datos.correo = correo || undefined;

    // La contraseña siempre se guarda cifrada (RNF-05).
    if (password) datos.password = await bcrypt.hash(password, 12);

    return datos;
};

// Traduce el error de "valor repetido" a un mensaje claro.
const explicarDuplicado = (error) => {
    if (error.code !== 11000) return error;
    const campo = Object.keys(error.keyPattern || {})[0];
    return new ErrorApp(409, campo === "correo"
        ? "Ese correo ya está asignado a otro empleado."
        : "Ya existe un empleado con ese número.");
};

// GET /api/empleados — lista sin contraseñas.
const listarEmpleados = async (req, res) => {
    const empleados = await Empleado.find().select("-password").sort("numeroEmpleado");
    res.json(empleados);
};

// POST /api/empleados
const crearEmpleado = async (req, res) => {
    const datos = await validarDatos(req.body || {}, true);
    try {
        const empleado = await Empleado.create(datos);
        res.status(201).json({ mensaje: "Empleado agregado.", id: empleado._id });
    } catch (error) {
        throw explicarDuplicado(error);
    }
};

// PUT /api/empleados/:id
const actualizarEmpleado = async (req, res) => {
    const empleado = await Empleado.findById(req.params.id);
    if (!empleado) throw new ErrorApp(404, "El empleado no existe.");

    const datos = await validarDatos(req.body || {}, false);

    // Evita que el administrador se quite a sí mismo el acceso de administrador.
    if (empleado._id.equals(req.usuario.id) && datos.rol !== "Administrador") {
        throw new ErrorApp(400, "No puedes quitarte el rol de Administrador a ti mismo.");
    }

    empleado.set(datos);
    try {
        await empleado.save();
    } catch (error) {
        throw explicarDuplicado(error);
    }
    res.json({ mensaje: "Empleado actualizado." });
};

// DELETE /api/empleados/:id
const eliminarEmpleado = async (req, res) => {
    if (String(req.params.id) === String(req.usuario.id)) {
        throw new ErrorApp(400, "No puedes eliminar tu propio usuario.");
    }

    const empleado = await Empleado.findByIdAndDelete(req.params.id);
    if (!empleado) throw new ErrorApp(404, "El empleado no existe.");

    res.json({ mensaje: "Empleado eliminado." });
};

module.exports = { listarEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado };
