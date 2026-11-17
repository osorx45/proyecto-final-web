import { useEffect, useState } from "react";

import Modal from "./Modal";
import SelectorPedido from "./SelectorPedido";
import { useDatos } from "../hooks/useDatos";
import { apiArchivo, apiRequest } from "../services/api";
import { formatearFecha } from "../utils/archivos";

// Ventana "Ver": muestra el PDF de la etiqueta y su bitácora (RF-18, RF-21).
export function ModalVerEtiqueta({ etiqueta, onCerrar }) {
    const [urlPdf, setUrlPdf] = useState("");
    const [error, setError] = useState("");
    const { datos: historial } = useDatos(`/etiquetas/${etiqueta.id}/historial`);

    // Pedimos el PDF y creamos una dirección temporal para mostrarlo.
    useEffect(() => {
        let url;
        apiArchivo(`/etiquetas/${etiqueta.id}/pdf`)
            .then((blob) => {
                url = URL.createObjectURL(blob);
                setUrlPdf(url);
            })
            .catch((e) => setError(e.message));

        // Al cerrar liberamos la memoria del PDF.
        return () => url && URL.revokeObjectURL(url);
    }, [etiqueta.id]);

    return (
        <Modal titulo={`Etiqueta No. ${etiqueta.idEtiqueta}`} onCerrar={onCerrar} ancho={720}>
            {error && <div className="aviso aviso-error">{error}</div>}

            {urlPdf && <iframe className="visor-pdf" src={`${urlPdf}#toolbar=0`} title="Etiqueta en PDF" />}

            <h3 className="subtitulo">Historial de movimientos</h3>
            <ul className="historial">
                {historial.map((h) => (
                    <li key={h._id}>
                        <strong>{h.accion}</strong> · {formatearFecha(h.fecha)} · {h.nombreEmpleado} (No. {h.numeroEmpleado})
                        <br />
                        <span>{h.detalle}</span>
                    </li>
                ))}
            </ul>
        </Modal>
    );
}

// Ventana "Editar": cambia el pedido, cliente y producto de la etiqueta.
// La caja y las piezas se recalculan solas en el Backend.
export function ModalEditarEtiqueta({ etiqueta, onCerrar, onGuardado }) {
    const { datos: pedidos, cargando } = useDatos("/pedidos/opciones");
    const [pedido, setPedido] = useState(null);
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        setGuardando(true);
        setError("");
        try {
            await apiRequest(`/etiquetas/${etiqueta.id}`, {
                method: "PUT",
                body: JSON.stringify({ pedido: pedido._id })
            });
            onGuardado();
        } catch (e) {
            setError(e.message);
            setGuardando(false);
        }
    };

    return (
        <Modal titulo={`Editar etiqueta No. ${etiqueta.idEtiqueta}`} onCerrar={onCerrar}>
            <p className="texto-ayuda">
                Elige el cliente, pedido y producto correctos. El número de caja
                y las piezas se asignan en automático.
            </p>

            {/* Esperamos a tener los pedidos para marcar la selección actual */}
            {!cargando && (
                <SelectorPedido pedidos={pedidos} inicial={etiqueta.pedidoId} onCambio={setPedido} />
            )}

            {error && <div className="aviso aviso-error">{error}</div>}

            <div className="modal-botones">
                <button className="boton boton-secundario" onClick={onCerrar}>Cancelar</button>
                <button
                    className="boton"
                    disabled={!pedido || pedido._id === etiqueta.pedidoId || guardando}
                    onClick={guardar}
                >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>
        </Modal>
    );
}
