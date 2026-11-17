const express = require("express");

const { verificarToken, verificarRol } = require("../middleware/auth");
const controlador = require("../controllers/empleadoController");

const router = express.Router();

// Todo el módulo de empleados es exclusivo del administrador (RF-16).
router.use(verificarToken, verificarRol("Administrador"));

router.get("/", controlador.listarEmpleados);
router.post("/", controlador.crearEmpleado);
router.put("/:id", controlador.actualizarEmpleado);
router.delete("/:id", controlador.eliminarEmpleado);

module.exports = router;
