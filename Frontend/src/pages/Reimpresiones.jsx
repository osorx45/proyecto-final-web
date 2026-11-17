import { useState } from "react";

import TablaDatos from "../components/TablaDatos";
import { ModalEditarEtiqueta, ModalVerEtiqueta } from "../components/ModalesEtiqueta";
import { useDatos } from "../hooks/useDatos";
import { apiArchivo, apiRequest } from "../services/api";
import { descargarArchivo, imprimirPdf } from "../utils/archivos";

// Columnas de la lista (RF-09).
const COLUMNAS = [
    { clave: "idEtiqueta", titulo: "Etiqueta", tipo: "numero" },
    { clave: "numeroPedido", titulo: "Pedido" },
    { clave: "cliente", titulo: "Cliente" },
    { clave: "producto", titulo: "Producto" },
    { clave: "caja", titulo: "Caja", tipo: "numero" },
    { clave: "piezas", titulo: "Piezas", tipo: "numero" },
    { clave: "fecha", titulo: "Fecha", tipo: "fecha" }
];

// Pantalla del operador con las etiquetas que él generó (RF-09 a RF-11).
function Reimpresiones() {
    const { datos: etiquetas, cargando, error, recargar } = useDatos("/etiquetas");

    const [viendo, setViendo] = useState(null);     // etiqueta abierta en "Ver"
    const [editando, setEditando] = useState(null); // etiqueta abierta en "Editar"
    const [aviso, setAviso] = useState(null);

    // Ejecuta una acción y muestra el error si falla.
    const intentar = async (accion) => {
        setAviso(null);
        try {
            await accion();
        } catch (e) {
            setAviso({ tipo: "error", texto: e.message });
        }
    };

    // ?reimprimir=1 hace que el Backend lo anote en la bitácora (RF-21).
    const reimprimir = (etiqueta) => intentar(async () => {
        imprimirPdf(await apiArchivo(`/etiquetas/${etiqueta.id}/pdf?reimprimir=1`));
    });

    const eliminar = (etiqueta) => intentar(async () => {
        if (!window.confirm(`¿Eliminar la etiqueta No. ${etiqueta.idEtiqueta}? Su caja quedará libre en el pedido.`)) return;
        await apiRequest(`/etiquetas/${etiqueta.id}`, { method: "DELETE" });
        setAviso({ tipo: "exito", texto: `Etiqueta No. ${etiqueta.idEtiqueta} eliminada.` });
        recargar();
    });

    const descargarReporte = () => intentar(async () => {
        descargarArchivo(await apiArchivo("/etiquetas/reporte-turno"), "reporte_turno.pdf");
    });

    return (
        <>
            <div className="titulo-fila">
                <h1 className="titulo">Reimpresiones</h1>
                <button className="boton" onClick={descargarReporte}>
                    Descargar reporte del turno
                </button>
            </div>

            {(error || aviso) && (
                <div className={`aviso aviso-${error ? "error" : aviso.tipo}`}>{error || aviso.texto}</div>
            )}

            {cargando ? <p>Cargando etiquetas...</p> : (
                <TablaDatos
                    columnas={COLUMNAS}
                    filas={etiquetas}
                    vacio="Todavía no has generado etiquetas."
                    acciones={(etiqueta) => (
                        <>
                            <button className="boton boton-chico" onClick={() => reimprimir(etiqueta)}>Reimprimir</button>
                            <button className="boton boton-secundario boton-chico" onClick={() => setViendo(etiqueta)}>Ver</button>
                            <button className="boton boton-secundario boton-chico" onClick={() => setEditando(etiqueta)}>Editar</button>
                            {/* Solo se eliminan las etiquetas del turno actual */}
                            <button
                                className="boton boton-peligro boton-chico"
                                disabled={!etiqueta.delTurno}
                                title={etiqueta.delTurno ? "" : "Solo se pueden eliminar etiquetas de tu turno actual"}
                                onClick={() => eliminar(etiqueta)}
                            >
                                Eliminar
                            </button>
                        </>
                    )}
                />
            )}

            {viendo && <ModalVerEtiqueta etiqueta={viendo} onCerrar={() => setViendo(null)} />}

            {editando && (
                <ModalEditarEtiqueta
                    etiqueta={editando}
                    onCerrar={() => setEditando(null)}
                    onGuardado={() => {
                        setEditando(null);
                        setAviso({ tipo: "exito", texto: "Etiqueta actualizada." });
                        recargar();
                    }}
                />
            )}
        </>
    );
}

export default Reimpresiones;
