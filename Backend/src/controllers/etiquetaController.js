const Etiqueta = require("../models/Etiqueta");
const Pedido = require("../models/Pedido");
const Historial = require("../models/Historial");
const ErrorApp = require("../utils/ErrorApp");
const { inicioDelTurno } = require("../utils/fechas");
const etiquetaService = require("../services/etiquetaService");
const { crearPdfEtiqueta, crearPdfReporteTurno } = require("../services/pdfService");
const { crearExcelEtiquetas } = require("../services/excelService");

const esOperador = (req) => req.usuario.rol === "Operador";

// Convierte una etiqueta (con su pedido y empleado) en un objeto plano,
// que es lo que usan las tablas del Frontend, los PDF y el Excel.
const aplanar = (etiqueta) => {
    const pedido = etiqueta.pedido || {};
    const empleado = etiqueta.empleado;

    return {
        id: etiqueta._id,
        idEtiqueta: etiqueta.idEtiqueta,
        pedidoId: pedido._id,
        numeroPedido: pedido.numeroPedido ?? "—",
        cliente: pedido.cliente ?? "—",
        producto: pedido.producto ?? "—",
        numeroCajas: pedido.numeroCajas ?? etiqueta.caja,
        caja: etiqueta.caja,
        piezas: etiqueta.piezas,
        fecha: etiqueta.fecha,
        operador: empleado ? `${empleado.nombre} ${empleado.apellido}`.trim() : "(empleado eliminado)",
        // true si la etiqueta se generó dentro del turno actual.
        delTurno: etiqueta.fecha >= inicioDelTurno()
    };
};

// Consulta etiquetas junto con los datos de su pedido y de su empleado.
const consultar = (filtro) => Etiqueta.find(filtro)
    .populate("pedido")
    .populate("empleado", "nombre apellido numeroEmpleado")
    .sort({ idEtiqueta: -1 });

// Busca la etiqueta de la URL. El operador solo puede usar las suyas.
const buscarEtiqueta = async (req) => {
    const [etiqueta] = await consultar({ _id: req.params.id });

    if (!etiqueta) throw new ErrorApp(404, "La etiqueta no existe.");

    if (esOperador(req) && !etiqueta.empleado?._id.equals(req.usuario.id)) {
        throw new ErrorApp(403, "Solo puedes trabajar con tus propias etiquetas.");
    }
    return etiqueta;
};

const enviarPdf = (res, pdf, nombre) => {
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombre}"`
    });
    res.send(pdf);
};

// GET /api/etiquetas — el administrador ve todas (RF-17);
// el operador ve las que él generó (RF-09).
const listarEtiquetas = async (req, res) => {
    const filtro = esOperador(req) ? { empleado: req.usuario.id } : {};
    const etiquetas = await consultar(filtro);
    res.json(etiquetas.map(aplanar));
};

// POST /api/etiquetas/vista-previa — PDF de cómo quedará la siguiente
// etiqueta del pedido, sin guardarla todavía (RF-05, RF-06).
const vistaPrevia = async (req, res) => {
    const pedido = await Pedido.findById(req.body?.pedido);
    if (!pedido) throw new ErrorApp(404, "El pedido no existe.");

    const siguiente = await etiquetaService.calcularSiguiente(pedido);
    if (!siguiente) {
        throw new ErrorApp(409, "El pedido ya tiene todas sus etiquetas generadas.");
    }

    const pdf = await crearPdfEtiqueta({
        ...siguiente,
        numeroCajas: pedido.numeroCajas,
        producto: pedido.producto,
        cliente: pedido.cliente,
        numeroPedido: pedido.numeroPedido,
        fecha: new Date(),
        operador: req.usuario.nombre,
        vistaPrevia: true
    });

    enviarPdf(res, pdf, "vista_previa.pdf");
};

// POST /api/etiquetas — guarda la etiqueta (RF-07). El Frontend pide
// enseguida su PDF para imprimirla, así todo ocurre con un solo botón.
const crearEtiqueta = async (req, res) => {
    const etiqueta = await etiquetaService.crearEtiqueta(req.body?.pedido, req.usuario);
    const [completa] = await consultar({ _id: etiqueta._id });

    res.status(201).json({ mensaje: "Etiqueta guardada.", etiqueta: aplanar(completa) });
};

// GET /api/etiquetas/:id/pdf — PDF de una etiqueta guardada (RF-10, RF-18).
// Con ?reimprimir=1 queda registrado en la bitácora (RF-21).
const obtenerPdf = async (req, res) => {
    const etiqueta = await buscarEtiqueta(req);
    const datos = aplanar(etiqueta);

    if (req.query.reimprimir) {
        await etiquetaService.registrarHistorial(
            "Reimprimir",
            datos.idEtiqueta,
            `Pedido ${datos.numeroPedido} (${datos.producto}), caja ${datos.caja}`,
            req.usuario
        );
    }

    enviarPdf(res, await crearPdfEtiqueta(datos), `etiqueta_${datos.idEtiqueta}.pdf`);
};

// PUT /api/etiquetas/:id — editar: se cambia el pedido de la etiqueta y con
// él su cliente y producto. Caja y piezas se recalculan en automático.
const actualizarEtiqueta = async (req, res) => {
    const etiqueta = await buscarEtiqueta(req);

    if (!req.body?.pedido) throw new ErrorApp(400, "Selecciona el pedido.");

    // Quitamos el populate para trabajar solo con el id del pedido.
    etiqueta.depopulate("pedido");
    await etiquetaService.cambiarPedido(etiqueta, req.body.pedido, req.usuario);

    res.json({ mensaje: "Etiqueta actualizada." });
};

// DELETE /api/etiquetas/:id — solo el operador y solo las etiquetas
// que generó en su turno actual (el administrador no elimina).
const eliminarEtiqueta = async (req, res) => {
    const etiqueta = await buscarEtiqueta(req);

    if (etiqueta.fecha < inicioDelTurno()) {
        throw new ErrorApp(403, "Solo puedes eliminar etiquetas de tu turno actual.");
    }

    etiqueta.depopulate("pedido");
    await etiquetaService.eliminarEtiqueta(etiqueta, req.usuario);

    res.json({ mensaje: "Etiqueta eliminada." });
};

// GET /api/etiquetas/:id/historial — movimientos de la etiqueta (RF-21).
const obtenerHistorial = async (req, res) => {
    const etiqueta = await buscarEtiqueta(req);
    const historial = await Historial.find({ idEtiqueta: etiqueta.idEtiqueta }).sort({ fecha: -1 });
    res.json(historial);
};

// GET /api/etiquetas/exportar — Excel con todas las etiquetas (RF-19).
const exportarExcel = async (req, res) => {
    const etiquetas = await consultar({});
    const excel = await crearExcelEtiquetas(etiquetas.map(aplanar));

    res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="etiquetas.xlsx"'
    });
    res.send(Buffer.from(excel));
};

// GET /api/etiquetas/reporte-turno — PDF del turno del operador (RF-11).
const reporteTurno = async (req, res) => {
    const desde = inicioDelTurno();

    const etiquetas = await consultar({ empleado: req.usuario.id, fecha: { $gte: desde } })
        .sort({ idEtiqueta: 1 });

    // Pedidos distintos en los que trabajó, con su avance actual.
    const idsPedidos = [...new Set(etiquetas.map((e) => String(e.pedido?._id)).filter(Boolean))];
    const pedidos = await Pedido.find({ _id: { $in: idsPedidos } }).sort("numeroPedido");

    const pdf = await crearPdfReporteTurno({
        operador: `${req.usuario.numeroEmpleado} - ${req.usuario.nombre}`,
        turno: req.usuario.turno,
        desde,
        hasta: new Date(),
        etiquetas: etiquetas.map(aplanar),
        pedidos
    });

    enviarPdf(res, pdf, "reporte_turno.pdf");
};

module.exports = {
    listarEtiquetas,
    vistaPrevia,
    crearEtiqueta,
    obtenerPdf,
    actualizarEtiqueta,
    eliminarEtiqueta,
    obtenerHistorial,
    exportarExcel,
    reporteTurno
};
