/*
  ============================================================================
  NOTA: FORMATO PROVISIONAL DEL ARCHIVO DE PEDIDOS
  ----------------------------------------------------------------------------
  El profesor todavía no entrega la estructura oficial del Excel/CSV.
  Todo lo que depende de ese formato está en ESTE archivo. Cuando se conozca
  la estructura real, normalmente solo habrá que cambiar el objeto COLUMNAS
  (y, si las fechas vienen distinto, la función leerFecha).
  ============================================================================
*/

const XLSX = require("xlsx");
const { PIEZAS_POR_CAJA_DEFAULT } = require("../config/constantes");

// NOTA (formato provisional): encabezados aceptados para cada dato.
// Se comparan sin mayúsculas, acentos, espacios ni guiones.
const COLUMNAS = {
    numeroPedido: ["pedido", "numeropedido", "numerodepedido", "nopedido"],
    cliente: ["cliente"],
    producto: ["producto", "color"],
    cantidad: ["cantidad", "piezas", "cantidadpiezas"],
    piezasPorCaja: ["piezasporcaja", "piezascaja", "pzasporcaja"],
    fecha: ["fecha", "fechapedido"]
};

// NOTA (formato provisional): columnas obligatorias. Las demás son opcionales.
const OBLIGATORIAS = ["numeroPedido", "cliente", "producto", "cantidad"];

// NOTA (formato provisional): encabezados y ejemplo de la plantilla descargable.
const PLANTILLA = [
    ["pedido", "cliente", "producto", "cantidad", "piezas_por_caja", "fecha"],
    ["1", "cliente 1", "azul", 1000, 50, "12/05/2025"],
    ["1", "cliente 1", "roja", 520, 50, "12/05/2025"],
    ["2", "cliente 2", "negra", 300, 25, "13/05/2025"]
];

// "Piezas por Caja" -> "piezasporcaja"
const normalizar = (texto) => String(texto ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");

// Convierte a entero positivo o devuelve null si no lo es.
const leerEntero = (valor) => {
    const numero = Number(String(valor ?? "").replace(/,/g, "").trim());
    return Number.isInteger(numero) && numero > 0 ? numero : null;
};

// NOTA (formato provisional): acepta fecha de Excel o texto "dd/mm/aaaa"
// (también "aaaa-mm-dd"). Se guarda a mediodía UTC para que el día no cambie
// al mostrarse en el horario de México.
const leerFecha = (valor) => {
    if (valor instanceof Date && !isNaN(valor)) {
        return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate(), 12));
    }
    const texto = String(valor ?? "").trim();
    let partes = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (partes) return new Date(Date.UTC(+partes[3], +partes[2] - 1, +partes[1], 12));
    partes = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (partes) return new Date(Date.UTC(+partes[1], +partes[2] - 1, +partes[3], 12));
    return null;
};

// Lee el archivo subido (.xlsx, .xls o .csv) y devuelve:
//   pedidos: renglones válidos listos para guardar
//   errores: [{ fila, motivo }] de los renglones que no se pudieron leer
const leerArchivoPedidos = (buffer, nombreArchivo) => {
    const esCsv = /\.csv$/i.test(nombreArchivo);

    // El CSV se lee como texto para respetar acentos y no alterar las fechas.
    const libro = esCsv
        ? XLSX.read(buffer.toString("utf8").replace(/^﻿/, ""), { type: "string", raw: true })
        : XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Usamos la primera hoja. Cada renglón llega como arreglo de celdas.
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const renglones = XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false, defval: "" });

    if (renglones.length < 2) {
        return { pedidos: [], errores: [{ fila: 1, motivo: "El archivo no tiene pedidos." }] };
    }

    // Ubicamos en qué posición está cada columna según su encabezado.
    const encabezados = renglones[0].map(normalizar);
    const posicion = {};
    for (const [campo, nombres] of Object.entries(COLUMNAS)) {
        posicion[campo] = encabezados.findIndex((e) => nombres.includes(e));
    }

    const faltantes = OBLIGATORIAS.filter((campo) => posicion[campo] === -1);
    if (faltantes.length) {
        return {
            pedidos: [],
            errores: [{ fila: 1, motivo: `Faltan las columnas: ${faltantes.join(", ")}.` }]
        };
    }

    const pedidos = [];
    const errores = [];
    const celda = (renglon, campo) => (posicion[campo] === -1 ? "" : renglon[posicion[campo]]);

    renglones.slice(1).forEach((renglon, i) => {
        const fila = i + 2; // +2: la fila 1 es el encabezado

        const numeroPedido = String(celda(renglon, "numeroPedido")).trim();
        const cliente = String(celda(renglon, "cliente")).trim();
        const producto = String(celda(renglon, "producto")).trim().toLowerCase();
        const cantidad = leerEntero(celda(renglon, "cantidad"));

        // Piezas por caja es opcional: si viene vacío se usa el valor por defecto.
        const textoPiezas = String(celda(renglon, "piezasPorCaja")).trim();
        const piezasPorCaja = textoPiezas === "" ? PIEZAS_POR_CAJA_DEFAULT : leerEntero(textoPiezas);

        if (!numeroPedido || !cliente || !producto) {
            return errores.push({ fila, motivo: "Falta pedido, cliente o producto." });
        }
        if (!cantidad) {
            return errores.push({ fila, motivo: "La cantidad debe ser un entero mayor que cero." });
        }
        if (!piezasPorCaja) {
            return errores.push({ fila, motivo: "Las piezas por caja deben ser un entero mayor que cero." });
        }

        pedidos.push({
            fila,
            numeroPedido,
            cliente,
            producto,
            cantidad,
            piezasPorCaja,
            fecha: leerFecha(celda(renglon, "fecha")) || new Date()
        });
    });

    return { pedidos, errores };
};

// Genera la plantilla de ejemplo en formato Excel.
const crearPlantilla = () => {
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(PLANTILLA), "Pedidos");
    return XLSX.write(libro, { type: "buffer", bookType: "xlsx" });
};

module.exports = { leerArchivoPedidos, crearPlantilla };
