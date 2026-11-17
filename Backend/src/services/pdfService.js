const PDFDocument = require("pdfkit");
const { formatearFecha } = require("../utils/fechas");

const AZUL = "#164b78";
const GRIS = "#5b6776";

// PDFKit escribe el PDF por partes; esta función las junta y
// devuelve el archivo completo (Buffer) listo para enviarse.
const terminarPdf = (doc) => new Promise((resolve, reject) => {
    const partes = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
    doc.end();
});

/*
  Etiqueta de producción (RF-06, RNF-03).
  Tamaño 6 x 4 pulgadas (432 x 288 puntos), el más común en impresoras de etiquetas.
  datos: { idEtiqueta, caja, numeroCajas, piezas, producto, cliente, numeroPedido,
           fecha, operador, vistaPrevia }
*/
const crearPdfEtiqueta = (datos) => {
    const ANCHO = 432;
    const ALTO = 288;
    const doc = new PDFDocument({ size: [ANCHO, ALTO], margin: 0 });

    // Marco exterior.
    doc.lineWidth(2).strokeColor(AZUL).rect(8, 8, ANCHO - 16, ALTO - 16).stroke();

    // Encabezado azul con el título del diseño.
    doc.rect(8, 8, ANCHO - 16, 46).fill(AZUL);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(15)
        .text("ETIQUETA DE PRODUCCIÓN", 8, 17, { width: ANCHO - 16, align: "center" });
    doc.font("Helvetica").fontSize(10)
        .text("Lapiceras BIG", 8, 36, { width: ANCHO - 16, align: "center" });

    // Dato pequeño (título gris) con su valor grande debajo.
    const campo = (titulo, valor, x, y, ancho, tamano = 16) => {
        doc.fillColor(GRIS).font("Helvetica").fontSize(8)
            .text(titulo.toUpperCase(), x, y, { width: ancho });
        doc.fillColor("black").font("Helvetica-Bold").fontSize(tamano)
            .text(String(valor), x, y + 11, { width: ancho, height: tamano + 4, ellipsis: true });
    };

    // Renglón principal: caja y piezas en grande.
    campo("Caja", `${datos.caja} de ${datos.numeroCajas}`, 24, 66, 190, 30);
    campo("Piezas", datos.piezas, 232, 66, 176, 30);

    doc.lineWidth(0.5).strokeColor("#b8c2cc").moveTo(24, 118).lineTo(ANCHO - 24, 118).stroke();

    campo("Producto", datos.producto, 24, 128, 190);
    campo("Pedido", datos.numeroPedido, 232, 128, 176);
    campo("Cliente", datos.cliente, 24, 174, ANCHO - 48);

    doc.moveTo(24, 220).lineTo(ANCHO - 24, 220).stroke();

    // Pie: folio, fecha y operador. En la vista previa aún no existe el folio.
    const folio = datos.vistaPrevia ? "VISTA PREVIA (sin guardar)" : `Etiqueta No. ${datos.idEtiqueta}`;
    doc.fillColor("black").font("Helvetica-Bold").fontSize(11).text(folio, 24, 230, { width: ANCHO - 48 });
    doc.fillColor(GRIS).font("Helvetica").fontSize(9)
        .text(`Fecha: ${formatearFecha(datos.fecha)}`, 24, 248, { width: 190 })
        .text(`Operador: ${datos.operador}`, 232, 248, { width: 176, height: 11, ellipsis: true });

    return terminarPdf(doc);
};

/*
  Reporte del turno (RF-11): etiquetas que generó el operador en su turno
  y el porcentaje de avance de los pedidos en los que trabajó.
  datos: { operador, turno, desde, hasta, etiquetas: [...], pedidos: [...] }
*/
const crearPdfReporteTurno = (datos) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 40 });
    const ANCHO = doc.page.width - 80;

    doc.rect(0, 0, doc.page.width, 70).fill(AZUL);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(16)
        .text("Empresa BIC control de etiquetas", 40, 20);
    doc.font("Helvetica").fontSize(11).text("Reporte del turno", 40, 42);

    doc.fillColor("black").fontSize(10).text(
        `Operador: ${datos.operador}     Turno: ${datos.turno}\n` +
        `Periodo: ${formatearFecha(datos.desde)} a ${formatearFecha(datos.hasta)}`,
        40, 86
    );

    // Dibuja una tabla sencilla. columnas: [{ titulo, ancho, valor(fila) }]
    const tabla = (titulo, columnas, filas) => {
        doc.moveDown(1.2);
        doc.x = 40;
        doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(12).text(titulo);
        doc.moveDown(0.4);

        const renglon = (textos, negrita) => {
            // Si ya no cabe el renglón, pasamos a una hoja nueva.
            if (doc.y > doc.page.height - 60) doc.addPage();
            const y = doc.y;
            let x = 40;
            doc.fillColor("black").font(negrita ? "Helvetica-Bold" : "Helvetica").fontSize(9);
            columnas.forEach((columna, i) => {
                doc.text(String(textos[i]), x, y, { width: columna.ancho - 6, height: 11, ellipsis: true });
                x += columna.ancho;
            });
            doc.y = y + 15;
            doc.lineWidth(0.5).strokeColor("#d5dbe1").moveTo(40, doc.y - 3).lineTo(40 + ANCHO, doc.y - 3).stroke();
        };

        renglon(columnas.map((c) => c.titulo), true);

        if (!filas.length) {
            doc.x = 40;
            doc.fillColor(GRIS).font("Helvetica").fontSize(9).text("Sin registros en este turno.");
        }
        filas.forEach((fila) => renglon(columnas.map((c) => c.valor(fila)), false));
    };

    tabla(`Etiquetas generadas (${datos.etiquetas.length})`, [
        { titulo: "Etiqueta", ancho: 55, valor: (e) => e.idEtiqueta },
        { titulo: "Pedido", ancho: 70, valor: (e) => e.numeroPedido },
        { titulo: "Cliente", ancho: 140, valor: (e) => e.cliente },
        { titulo: "Producto", ancho: 90, valor: (e) => e.producto },
        { titulo: "Caja", ancho: 45, valor: (e) => e.caja },
        { titulo: "Piezas", ancho: 45, valor: (e) => e.piezas },
        { titulo: "Fecha", ancho: 87, valor: (e) => formatearFecha(e.fecha) }
    ], datos.etiquetas);

    tabla("Avance de los pedidos trabajados", [
        { titulo: "Pedido", ancho: 70, valor: (p) => p.numeroPedido },
        { titulo: "Cliente", ancho: 150, valor: (p) => p.cliente },
        { titulo: "Producto", ancho: 100, valor: (p) => p.producto },
        { titulo: "Cajas", ancho: 70, valor: (p) => `${p.cajasGeneradas} / ${p.numeroCajas}` },
        { titulo: "Avance", ancho: 60, valor: (p) => `${p.porcentaje}%` },
        { titulo: "Estatus", ancho: 82, valor: (p) => p.estatus }
    ], datos.pedidos);

    return terminarPdf(doc);
};

module.exports = { crearPdfEtiqueta, crearPdfReporteTurno };
