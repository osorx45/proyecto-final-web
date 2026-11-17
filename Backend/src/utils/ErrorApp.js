// Error con código HTTP. Permite hacer "throw new ErrorApp(404, 'mensaje')"
// en cualquier parte y que el manejador de errores responda con ese código.
class ErrorApp extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

module.exports = ErrorApp;
