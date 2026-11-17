const Pedido = require("../models/Pedido");
const Producto = require("../models/Producto");
const ErrorApp = require("../utils/ErrorApp");
const { leerArchivoPedidos, crearPlantilla } = require("../utils/formatoImportacion");

const TIPO_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// GET /api/pedidos — lista completa para el administrador (RF-13).
const listarPedidos = async (req, res) => {
    const pedidos = await Pedido.find().sort({ fecha: -1, numeroPedido: 1 });
    res.json(pedidos);
};

// GET /api/pedidos/opciones — pedidos para las listas desplegables de
// "Generar etiqueta" y "Editar etiqueta" (RF-04, RF-08).
// El Frontend filtra: cliente -> pedidos del cliente -> productos del pedido.
const listarOpciones = async (req, res) => {
    const pedidos = await Pedido.find()
        .select("numeroPedido cliente producto numeroCajas cajasGeneradas estatus")
        .sort({ cliente: 1, numeroPedido: 1, producto: 1 });
    res.json(pedidos);
};

// POST /api/pedidos/importar — carga pedidos desde Excel o CSV (RF-12).
const importarPedidos = async (req, res) => {
    if (!req.file) throw new ErrorApp(400, "Selecciona un archivo Excel o CSV.");

    if (!/\.(xlsx|xls|csv)$/i.test(req.file.originalname)) {
        throw new ErrorApp(400, "El archivo debe ser .xlsx, .xls o .csv.");
    }

    const { pedidos, errores } = leerArchivoPedidos(req.file.buffer, req.file.originalname);
    let importados = 0;

    for (const datos of pedidos) {
        const { fila, ...pedido } = datos;

        // RF-22: se calculan las etiquetas (cajas) necesarias del pedido.
        // Math.ceil redondea hacia arriba: 520 piezas / 50 por caja = 11 cajas.
        pedido.numeroCajas = Math.ceil(pedido.cantidad / pedido.piezasPorCaja);

        try {
            await Pedido.create(pedido);
            importados++;

            // Los productos se dan de alta solos al venir en el archivo.
            await Producto.updateOne(
                { nombre: pedido.producto },
                { $setOnInsert: { nombre: pedido.producto } },
                { upsert: true }
            );
        } catch (error) {
            // 11000 = ya existe ese pedido con ese producto: se omite el renglón.
            errores.push({
                fila,
                motivo: error.code === 11000
                    ? `El pedido ${pedido.numeroPedido} con producto "${pedido.producto}" ya existe.`
                    : "No se pudo guardar el renglón."
            });
        }
    }

    errores.sort((a, b) => a.fila - b.fila);

    res.status(importados ? 201 : 400).json({
        mensaje: `Se importaron ${importados} pedido(s). Renglones omitidos: ${errores.length}.`,
        importados,
        errores
    });
};

// GET /api/pedidos/plantilla — descarga el Excel de ejemplo para importar.
const descargarPlantilla = (req, res) => {
    res.set({
        "Content-Type": TIPO_EXCEL,
        "Content-Disposition": 'attachment; filename="plantilla_pedidos.xlsx"'
    });
    res.send(crearPlantilla());
};

// DELETE /api/pedidos/:id — solo si está "No iniciado" (RF-14).
const eliminarPedido = async (req, res) => {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) throw new ErrorApp(404, "El pedido no existe.");

    if (pedido.estatus !== "No iniciado") {
        throw new ErrorApp(409, "Solo se pueden eliminar pedidos no iniciados.");
    }

    await pedido.deleteOne();
    res.json({ mensaje: "Pedido eliminado." });
};

module.exports = {
    listarPedidos,
    listarOpciones,
    importarPedidos,
    descargarPlantilla,
    eliminarPedido
};
