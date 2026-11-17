const express = require("express");
const rateLimit = require("express-rate-limit");

const { verificarToken } = require("../middleware/auth");
const {
    iniciarSesion,
    iniciarSesionGoogle,
    obtenerPerfil
} = require("../controllers/authController");

const router = express.Router();

// Máximo 20 intentos de inicio de sesión cada 15 minutos por dirección IP,
// para dificultar que alguien adivine contraseñas probando muchas veces.
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { mensaje: "Demasiados intentos. Espera unos minutos." }
});

router.post("/login", limiteLogin, iniciarSesion);
router.post("/google", limiteLogin, iniciarSesionGoogle);
router.get("/perfil", verificarToken, obtenerPerfil);

module.exports = router;
