import { useMemo, useState } from "react";
import { formatearFecha } from "../utils/archivos";

// Operadores de filtro disponibles según el tipo de columna.
const OPERADORES = {
    texto: ["contiene", "igual a"],
    numero: ["igual a", "mayor que", "menor que"],
    fecha: ["contiene"]
};

// Texto que se muestra (y se filtra) para una celda.
const textoCelda = (columna, fila) => {
    const valor = fila[columna.clave];
    if (columna.tipo === "fecha") return formatearFecha(valor, columna.conHora !== false);
    return valor ?? "";
};

/*
  Tabla reutilizable con filtro, orden y paginación (RF-20).
  Props:
    columnas: [{ clave, titulo, tipo: "texto" | "numero" | "fecha", render? }]
    filas:    arreglo de objetos
    acciones: función opcional (fila) => botones de la última columna
*/
function TablaDatos({ columnas, filas, acciones, vacio = "No hay registros." }) {
    const [filtro, setFiltro] = useState({ columna: columnas[0].clave, operador: "contiene", valor: "" });
    const [orden, setOrden] = useState({ clave: null, ascendente: true });
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);

    const columnaFiltro = columnas.find((c) => c.clave === filtro.columna);
    const operadores = OPERADORES[columnaFiltro.tipo || "texto"];

    // Al cambiar de columna elegimos el primer operador válido para su tipo.
    const cambiarColumna = (clave) => {
        const tipo = columnas.find((c) => c.clave === clave).tipo || "texto";
        setFiltro({ ...filtro, columna: clave, operador: OPERADORES[tipo][0] });
        setPagina(1);
    };

    // 1) Filtrar y 2) ordenar. useMemo evita repetir el trabajo si nada cambió.
    const filasVisibles = useMemo(() => {
        const buscado = filtro.valor.trim().toLowerCase();
        let resultado = filas;

        if (buscado) {
            resultado = filas.filter((fila) => {
                const valor = String(textoCelda(columnaFiltro, fila)).toLowerCase();
                switch (filtro.operador) {
                    case "igual a": return valor === buscado;
                    case "mayor que": return Number(valor) > Number(buscado);
                    case "menor que": return Number(valor) < Number(buscado);
                    default: return valor.includes(buscado);
                }
            });
        }

        if (orden.clave) {
            const columna = columnas.find((c) => c.clave === orden.clave);
            resultado = [...resultado].sort((a, b) => {
                const x = a[orden.clave] ?? "";
                const y = b[orden.clave] ?? "";
                // Números por valor, fechas por tiempo y textos por alfabeto.
                const diferencia = columna.tipo === "numero" ? x - y
                    : columna.tipo === "fecha" ? new Date(x) - new Date(y)
                    : String(x).localeCompare(String(y), "es", { numeric: true });
                return orden.ascendente ? diferencia : -diferencia;
            });
        }

        return resultado;
    }, [filas, filtro, orden, columnas, columnaFiltro]);

    // 3) Paginar.
    const totalPaginas = Math.max(1, Math.ceil(filasVisibles.length / porPagina));
    const paginaActual = Math.min(pagina, totalPaginas);
    const filasPagina = filasVisibles.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

    // Clic en un encabezado: ordena por esa columna o invierte el orden.
    const ordenarPor = (clave) => {
        setOrden({ clave, ascendente: orden.clave === clave ? !orden.ascendente : true });
    };

    return (
        <div className="tabla-contenedor">
            {/* Filtro: columna, operador y valor */}
            <div className="tabla-filtros">
                <span>Filtrar:</span>
                <select
                    aria-label="Columna"
                    value={filtro.columna}
                    onChange={(e) => cambiarColumna(e.target.value)}
                >
                    {columnas.map((c) => <option key={c.clave} value={c.clave}>{c.titulo}</option>)}
                </select>
                <select
                    aria-label="Operador"
                    value={filtro.operador}
                    onChange={(e) => { setFiltro({ ...filtro, operador: e.target.value }); setPagina(1); }}
                >
                    {operadores.map((o) => <option key={o}>{o}</option>)}
                </select>
                <input
                    aria-label="Valor"
                    placeholder="Valor a buscar"
                    value={filtro.valor}
                    onChange={(e) => { setFiltro({ ...filtro, valor: e.target.value }); setPagina(1); }}
                />
                {filtro.valor && (
                    <button className="boton boton-secundario boton-chico" onClick={() => setFiltro({ ...filtro, valor: "" })}>
                        Limpiar
                    </button>
                )}
            </div>

            <div className="tabla-scroll">
                <table className="tabla">
                    <thead>
                        <tr>
                            {columnas.map((c) => (
                                <th key={c.clave} onClick={() => ordenarPor(c.clave)} title="Ordenar">
                                    {c.titulo}
                                    <span className="tabla-flecha">
                                        {orden.clave === c.clave ? (orden.ascendente ? " ▲" : " ▼") : " ↕"}
                                    </span>
                                </th>
                            ))}
                            {acciones && <th className="tabla-sin-orden">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filasPagina.map((fila) => (
                            <tr key={fila.id || fila._id}>
                                {columnas.map((c) => (
                                    <td key={c.clave}>
                                        {c.render ? c.render(fila) : textoCelda(c, fila)}
                                    </td>
                                ))}
                                {acciones && <td className="tabla-acciones">{acciones(fila)}</td>}
                            </tr>
                        ))}
                        {!filasPagina.length && (
                            <tr>
                                <td className="tabla-vacia" colSpan={columnas.length + (acciones ? 1 : 0)}>
                                    {vacio}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="tabla-paginacion">
                <span>{filasVisibles.length} registro(s)</span>
                <select
                    aria-label="Registros por página"
                    value={porPagina}
                    onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
                >
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n} por página</option>)}
                </select>
                <button
                    className="boton boton-secundario boton-chico"
                    disabled={paginaActual === 1}
                    onClick={() => setPagina(paginaActual - 1)}
                >
                    ‹ Anterior
                </button>
                <span>Página {paginaActual} de {totalPaginas}</span>
                <button
                    className="boton boton-secundario boton-chico"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina(paginaActual + 1)}
                >
                    Siguiente ›
                </button>
            </div>
        </div>
    );
}

export default TablaDatos;
