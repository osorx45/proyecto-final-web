const express = require("express");

const { verificarToken, verificarRol } = require("../middleware/auth");
const controlador = require("../controllers/etiquetaController");

const router = express.Router();

router.use(verificarToken);

// Rutas con nombre fijo. Van antes de "/:id" para que Express no las confunda.
router.get("/exportar", verificarRol("Administrador"), controlador.exportarExcel);
router.get("/reporte-turno", verificarRol("Operador"), controlador.reporteTurno);
router.post("/vista-previa", verificarRol("Operador"), controlador.vistaPrevia);

router.get("/", controlador.listarEtiquetas);
router.post("/", verificarRol("Operador"), controlador.crearEtiqueta);

// Rutas de una etiqueta específica.
router.get("/:id/pdf", controlador.obtenerPdf);
router.get("/:id/historial", controlador.obtenerHistorial);
router.put("/:id", controlador.actualizarEtiqueta);
router.delete("/:id", verificarRol("Operador"), controlador.eliminarEtiqueta);

module.exports = router;
