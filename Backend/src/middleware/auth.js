const jwt = require("jsonwebtoken");
const Empleado = require("../models/Empleado");

// Verifica que la petición traiga un JWT válido en el encabezado
// "Authorization: Bearer <token>" y deja los datos del empleado en req.usuario.
const verificarToken = async (req, res, next) => {
    try {
        const encabezado = req.headers.authorization;

        if (!encabezado || !encabezado.startsWith("Bearer ")) {
            return res.status(401).json({
                mensaje: "No se proporcionó un token de acceso."
            });
        }

        const token = encabezado.split(" ")[1];
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        // Consultamos al empleado para que un usuario eliminado o desactivado
        // pierda el acceso aunque su token todavía no haya expirado.
        const empleado = await Empleado.findById(datos.id);

        if (!empleado || !empleado.activo) {
            return res.status(401).json({
                mensaje: "Tu usuario ya no tiene acceso al sistema."
            });
        }

        req.usuario = {
            id: empleado._id,
            numeroEmpleado: empleado.numeroEmpleado,
            nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
            turno: empleado.turno,
            rol: empleado.rol
        };

        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: "El token no es válido o ha expirado."
        });
    }
};

// Permite el paso solo a los roles indicados (RNF-02).
// Uso: router.get("/", verificarRol("Administrador"), controlador)
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: "No tienes permisos para realizar esta acción."
            });
        }
        next();
    };
};

module.exports = { verificarToken, verificarRol };
