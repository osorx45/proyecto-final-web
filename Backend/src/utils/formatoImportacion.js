/*
  ============================================================================
  FORMATO DEL ARCHIVO DE PEDIDOS (Excel o CSV)
  ----------------------------------------------------------------------------
  Formato oficial entregado por el profesor:

      id_pedido,id_cliente,cliente,producto,cantidad
      1,1,Papelería El Lápiz,Azul,150

  Columnas opcionales que el sistema también acepta si vienen:
      piezas_por_caja  (si no viene se usan 50, ver config/constantes.js)
      fecha            (si no viene se usa la fecha en que se importa)

  Todo lo que depende del formato está en ESTE archivo.
  ============================================================================
*/

const XLSX = require("xlsx");
const { PIEZAS_POR_CAJA_DEFAULT } = require("../config/constantes");

// Encabezados aceptados para cada dato. Se comparan sin mayúsculas,
// acentos, espacios ni guiones: "id_pedido" se lee como "idpedido".
const COLUMNAS = {
    numeroPedido: ["idpedido", "pedido", "numeropedido", "numerodepedido", "nopedido"],
    idCliente: ["idcliente", "numerocliente"],
    cliente: ["cliente", "nombrecliente"],
    producto: ["producto", "color"],
    cantidad: ["cantidad", "piezas", "cantidadpiezas"],
    piezasPorCaja: ["piezasporcaja", "piezascaja", "pzasporcaja"],
    fecha: ["fecha", "fechapedido"]
};

// Columnas obligatorias. Las demás son opcionales.
const OBLIGATORIAS = ["numeroPedido", "cliente", "producto", "cantidad"];

// Encabezados y ejemplo de la plantilla descargable (formato oficial).
const PLANTILLA = [
    ["id_pedido", "id_cliente", "cliente", "producto", "cantidad"],
    [1, 1, "Papelería El Lápiz", "Azul", 150],
    [2, 2, "Oficinas Ramírez SA", "Rojo", 400],
    [3, 3, "Colegio Monteverde", "Negro", 750]
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

// Acepta fecha de Excel o texto "dd/mm/aaaa"
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
    // Si se guardó desde Excel como "CSV (delimitado por comas)" puede venir en
    // Windows-1252 en lugar de UTF-8: lo detectamos por los caracteres inválidos.
    let texto = buffer.toString("utf8");
    if (texto.includes("\uFFFD")) texto = buffer.toString("latin1");

    const libro = esCsv
        ? XLSX.read(texto.replace(/^\uFEFF/, ""), { type: "string", raw: true })
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
        const idCliente = String(celda(renglon, "idCliente")).trim();
        const cliente = String(celda(renglon, "cliente")).trim();
        // El producto se guarda como "Azul" aunque venga "AZUL" o "azul",
        // para que el mismo color no aparezca dos veces.
        const textoProducto = String(celda(renglon, "producto")).trim().toLowerCase();
        const producto = textoProducto.charAt(0).toUpperCase() + textoProducto.slice(1);
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
            idCliente,
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
