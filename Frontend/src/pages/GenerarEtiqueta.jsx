import { useEffect, useState } from "react";

import SelectorPedido from "../components/SelectorPedido";
import { useDatos } from "../hooks/useDatos";
import { apiArchivo, apiRequest } from "../services/api";
import { imprimirPdf } from "../utils/archivos";

// Pantalla principal del operador (RF-04 a RF-08).
function GenerarEtiqueta() {
    const { datos: pedidos, cargando, error: errorPedidos, recargar } = useDatos("/pedidos/opciones");

    const [pedido, setPedido] = useState(null);     // pedido + producto elegido
    const [urlVista, setUrlVista] = useState("");   // PDF de la vista previa
    const [aviso, setAviso] = useState(null);       // { tipo, texto }
    const [guardando, setGuardando] = useState(false);

    // Al cambiar este número el selector se reinicia (se usa como "key").
    const [reinicio, setReinicio] = useState(0);

    // Cada vez que se elige un pedido pedimos el PDF de la siguiente etiqueta.
    useEffect(() => {
        setUrlVista("");
        if (!pedido) return;

        let url;
        let cancelado = false;

        apiArchivo("/etiquetas/vista-previa", {
            method: "POST",
            body: JSON.stringify({ pedido: pedido._id })
        })
            .then((blob) => {
                if (cancelado) return;
                url = URL.createObjectURL(blob);
                setUrlVista(url);
            })
            .catch((e) => !cancelado && setAviso({ tipo: "error", texto: e.message }));

        // Limpieza: si el usuario cambia de pedido descartamos el PDF anterior.
        return () => {
            cancelado = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [pedido]);

    // Un solo botón: guarda la etiqueta y la manda a imprimir (RF-07).
    const guardarEImprimir = async () => {
        setGuardando(true);
        setAviso(null);
        try {
            const { etiqueta } = await apiRequest("/etiquetas", {
                method: "POST",
                body: JSON.stringify({ pedido: pedido._id })
            });

            imprimirPdf(await apiArchivo(`/etiquetas/${etiqueta.id}/pdf`));

            setAviso({
                tipo: "exito",
                texto: `Etiqueta No. ${etiqueta.idEtiqueta} guardada: caja ${etiqueta.caja} de ${etiqueta.numeroCajas}, ${etiqueta.piezas} piezas.`
            });

            await recargar(); // actualiza el avance que muestran las listas

            if (pedido.cajasGeneradas + 1 >= pedido.numeroCajas) {
                // Era la última caja: el pedido terminó y limpiamos la selección.
                setPedido(null);
                setReinicio((n) => n + 1);
            } else {
                // Quedan cajas: al cambiar el objeto se pide la vista previa
                // de la siguiente, lista para seguir imprimiendo.
                setPedido({ ...pedido, cajasGeneradas: pedido.cajasGeneradas + 1 });
            }
        } catch (e) {
            setAviso({ tipo: "error", texto: e.message });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <h1 className="titulo">Generar etiqueta</h1>

            {errorPedidos && <div className="aviso aviso-error">{errorPedidos}</div>}

            <div className="generar">
                <section className="tarjeta">
                    <h2 className="subtitulo">Datos de la caja</h2>

                    {cargando ? <p>Cargando pedidos...</p> : (
                        <SelectorPedido key={reinicio} pedidos={pedidos} onCambio={(p) => { setPedido(p); setAviso(null); }} />
                    )}

                    {!cargando && !pedidos.length && (
                        <p className="texto-ayuda">
                            Todavía no hay pedidos. El administrador debe importarlos primero.
                        </p>
                    )}

                    <p className="texto-ayuda">
                        El número de caja y la cantidad de piezas se generan en automático.
                    </p>

                    <button
                        className="boton boton-grande"
                        disabled={!urlVista || guardando}
                        onClick={guardarEImprimir}
                    >
                        {guardando ? "Guardando..." : "Guardar e imprimir"}
                    </button>

                    {aviso && <div className={`aviso aviso-${aviso.tipo}`} role="status">{aviso.texto}</div>}
                </section>

                <section className="tarjeta">
                    <h2 className="subtitulo">Vista previa de la etiqueta</h2>

                    {urlVista
                        ? <iframe className="visor-pdf" src={`${urlVista}#toolbar=0`} title="Vista previa de la etiqueta" />
                        : <div className="visor-vacio">Selecciona cliente, pedido y producto para ver la etiqueta.</div>}
                </section>
            </div>
        </>
    );
}

export default GenerarEtiqueta;
