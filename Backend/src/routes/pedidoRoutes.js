const express = require("express");
const multer = require("multer");

const { verificarToken, verificarRol } = require("../middleware/auth");
const controlador = require("../controllers/pedidoController");

const router = express.Router();

// Multer recibe el archivo en memoria (no se guarda en disco). Máximo 5 MB.
const subir = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(verificarToken);

// Los dos roles necesitan los pedidos para las listas desplegables.
router.get("/opciones", controlador.listarOpciones);

// El resto es solo para el administrador.
router.use(verificarRol("Administrador"));

router.get("/", controlador.listarPedidos);
router.get("/plantilla", controlador.descargarPlantilla);
router.post("/importar", subir.single("archivo"), controlador.importarPedidos);
router.delete("/:id", controlador.eliminarPedido);

module.exports = router;
