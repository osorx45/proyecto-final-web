import { useRef, useState } from "react";

import TablaDatos from "../components/TablaDatos";
import { useDatos } from "../hooks/useDatos";
import { apiArchivo, apiRequest } from "../services/api";
import { descargarArchivo } from "../utils/archivos";

// Clase de color para cada estatus.
const CLASE_ESTATUS = {
    "No iniciado": "estatus-gris",
    "En progreso": "estatus-azul",
    "Terminado": "estatus-verde"
};

// Columnas de la lista (RF-13). "render" dibuja celdas especiales.
const COLUMNAS = [
    { clave: "numeroPedido", titulo: "Pedido" },
    { clave: "cantidad", titulo: "Cantidad", tipo: "numero" },
    { clave: "producto", titulo: "Producto" },
    { clave: "cliente", titulo: "Cliente" },
    { clave: "fecha", titulo: "Fecha", tipo: "fecha", conHora: false },
    {
        clave: "cajasGeneradas",
        titulo: "Cajas",
        tipo: "numero",
        render: (p) => `${p.cajasGeneradas} / ${p.numeroCajas}`
    },
    {
        clave: "estatus",
        titulo: "Estatus",
        render: (p) => <span className={`estatus ${CLASE_ESTATUS[p.estatus]}`}>{p.estatus}</span>
    },
    {
        clave: "porcentaje",
        titulo: "Avance",
        tipo: "numero",
        render: (p) => (
            <div className="avance" title={`${p.porcentaje}%`}>
                <div className="avance-barra"><div style={{ width: `${p.porcentaje}%` }} /></div>
                <span>{p.porcentaje}%</span>
            </div>
        )
    }
];

// Pantalla del administrador para importar y dar seguimiento a pedidos (RF-12 a RF-14).
function Pedidos() {
    const { datos: pedidos, cargando, error, recargar } = useDatos("/pedidos");

    const [aviso, setAviso] = useState(null);       // { tipo, texto, errores }
    const [importando, setImportando] = useState(false);
    const entradaArchivo = useRef(null);            // <input type="file"> oculto

    // Envía al Backend el archivo elegido.
    const importar = async (e) => {
        const archivo = e.target.files[0];
        e.target.value = ""; // permite volver a elegir el mismo archivo
        if (!archivo) return;

        const formulario = new FormData();
        formulario.append("archivo", archivo);

        setImportando(true);
        setAviso(null);
        try {
            const respuesta = await apiRequest("/pedidos/importar", { method: "POST", body: formulario });
            setAviso({ tipo: "exito", texto: respuesta.mensaje, errores: respuesta.errores });
            recargar();
        } catch (err) {
            // Si ningún renglón fue válido, el Backend también manda el detalle.
            setAviso({ tipo: "error", texto: err.message, errores: err.datos?.errores });
        } finally {
            setImportando(false);
        }
    };

    const descargarPlantilla = async () => {
        try {
            descargarArchivo(await apiArchivo("/pedidos/plantilla"), "plantilla_pedidos.xlsx");
        } catch (err) {
            setAviso({ tipo: "error", texto: err.message });
        }
    };

    const eliminar = async (pedido) => {
        if (!window.confirm(`¿Eliminar el pedido ${pedido.numeroPedido} (${pedido.producto})?`)) return;
        try {
            await apiRequest(`/pedidos/${pedido._id}`, { method: "DELETE" });
            setAviso({ tipo: "exito", texto: "Pedido eliminado." });
            recargar();
        } catch (err) {
            setAviso({ tipo: "error", texto: err.message });
        }
    };

    return (
        <>
            <div className="titulo-fila">
                <h1 className="titulo">Pedidos</h1>
                <div className="botones">
                    <button className="boton boton-secundario" onClick={descargarPlantilla}>
                        Descargar plantilla
                    </button>
                    <button className="boton" disabled={importando} onClick={() => entradaArchivo.current.click()}>
                        {importando ? "Importando..." : "Importar pedidos (Excel o CSV)"}
                    </button>
                    <input ref={entradaArchivo} type="file" accept=".xlsx,.xls,.csv" hidden onChange={importar} />
                </div>
            </div>

            {error && <div className="aviso aviso-error">{error}</div>}

            {aviso && (
                <div className={`aviso aviso-${aviso.tipo}`} role="status">
                    {aviso.texto}
                    {/* Detalle de los renglones que no se pudieron importar */}
                    {aviso.errores?.length > 0 && (
                        <ul>
                            {aviso.errores.map((err, i) => <li key={i}>Fila {err.fila}: {err.motivo}</li>)}
                        </ul>
                    )}
                </div>
            )}

            {cargando ? <p>Cargando pedidos...</p> : (
                <TablaDatos
                    columnas={COLUMNAS}
                    filas={pedidos}
                    vacio="No hay pedidos. Importa un archivo para comenzar."
                    acciones={(pedido) => (
                        // Solo se puede eliminar un pedido no iniciado (RF-14).
                        <button
                            className="boton boton-peligro boton-chico"
                            disabled={pedido.estatus !== "No iniciado"}
                            title={pedido.estatus === "No iniciado" ? "" : "Solo se eliminan pedidos no iniciados"}
                            onClick={() => eliminar(pedido)}
                        >
                            Eliminar
                        </button>
                    )}
                />
            )}
        </>
    );
}

export default Pedidos;
