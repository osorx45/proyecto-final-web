// Ventana emergente genérica. "ancho" permite hacerla más grande (ej. para un PDF).
function Modal({ titulo, onCerrar, children, ancho = 480 }) {
    return (
        <div className="modal-fondo" onMouseDown={onCerrar}>
            {/* stopPropagation evita que un clic dentro de la ventana la cierre */}
            <div
                className="modal"
                style={{ maxWidth: ancho }}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="modal-titulo">
                    <h2>{titulo}</h2>
                    <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default Modal;
