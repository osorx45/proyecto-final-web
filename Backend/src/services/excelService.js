const ExcelJS = require("exceljs");
const { formatearFecha } = require("../utils/fechas");

// Crea el Excel con la lista de etiquetas (RF-19).
// "etiquetas" ya llega con el formato plano que usa la tabla del Frontend.
const crearExcelEtiquetas = async (etiquetas) => {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet("Etiquetas");

    hoja.columns = [
        { header: "Id etiqueta", key: "idEtiqueta", width: 12 },
        { header: "Pedido", key: "numeroPedido", width: 14 },
        { header: "Cliente", key: "cliente", width: 28 },
        { header: "Producto", key: "producto", width: 16 },
        { header: "Caja", key: "caja", width: 8 },
        { header: "Piezas", key: "piezas", width: 10 },
        { header: "Fecha", key: "fecha", width: 18 },
        { header: "Empleado", key: "operador", width: 26 }
    ];

    // Encabezado en negritas con fondo azul.
    hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF164B78" } };

    etiquetas.forEach((e) => hoja.addRow({ ...e, fecha: formatearFecha(e.fecha) }));

    return libro.xlsx.writeBuffer();
};

module.exports = { crearExcelEtiquetas };
