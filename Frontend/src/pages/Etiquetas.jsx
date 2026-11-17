import { useState } from "react";

import TablaDatos from "../components/TablaDatos";
import { ModalEditarEtiqueta, ModalVerEtiqueta } from "../components/ModalesEtiqueta";
import { useDatos } from "../hooks/useDatos";
import { apiArchivo } from "../services/api";
import { descargarArchivo, imprimirPdf } from "../utils/archivos";

// Columnas de la lista (RF-17).
const COLUMNAS = [
    { clave: "idEtiqueta", titulo: "Id etiqueta", tipo: "numero" },
    { clave: "numeroPedido", titulo: "Pedido" },
    { clave: "cliente", titulo: "Cliente" },
    { clave: "producto", titulo: "Producto" },
    { clave: "caja", titulo: "Caja", tipo: "numero" },
    { clave: "piezas", titulo: "Piezas", tipo: "numero" },
    { clave: "fecha", titulo: "Fecha", tipo: "fecha" },
    { clave: "operador", titulo: "Empleado" }
];

// Pantalla del administrador con todas las etiquetas (RF-17 a RF-19).
// A diferencia de Reimpresiones, aquí no existe el botón de eliminar.
function Etiquetas() {
    const { datos: etiquetas, cargando, error, recargar } = useDatos("/etiquetas");

    const [viendo, setViendo] = useState(null);
    const [editando, setEditando] = useState(null);
    const [aviso, setAviso] = useState(null);

    const intentar = async (accion) => {
        setAviso(null);
        try {
            await accion();
        } catch (e) {
            setAviso({ tipo: "error", texto: e.message });
        }
    };

    const imprimir = (etiqueta) => intentar(async () => {
        imprimirPdf(await apiArchivo(`/etiquetas/${etiqueta.id}/pdf?reimprimir=1`));
    });

    const descargarExcel = () => intentar(async () => {
        descargarArchivo(await apiArchivo("/etiquetas/exportar"), "etiquetas.xlsx");
    });

    return (
        <>
            <div className="titulo-fila">
                <h1 className="titulo">Etiquetas</h1>
                <button className="boton" onClick={descargarExcel} disabled={!etiquetas.length}>
                    Descargar Excel
                </button>
            </div>

            {(error || aviso) && (
                <div className={`aviso aviso-${error ? "error" : aviso.tipo}`}>{error || aviso.texto}</div>
            )}

            {cargando ? <p>Cargando etiquetas...</p> : (
                <TablaDatos
                    columnas={COLUMNAS}
                    filas={etiquetas}
                    vacio="Todavía no hay etiquetas generadas."
                    acciones={(etiqueta) => (
                        <>
                            <button className="boton boton-chico" onClick={() => imprimir(etiqueta)}>Imprimir</button>
                            <button className="boton boton-secundario boton-chico" onClick={() => setViendo(etiqueta)}>Ver</button>
                            <button className="boton boton-secundario boton-chico" onClick={() => setEditando(etiqueta)}>Editar</button>
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

export default Etiquetas;
