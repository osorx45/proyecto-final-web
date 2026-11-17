const Pedido = require("../models/Pedido");
const Etiqueta = require("../models/Etiqueta");
const Historial = require("../models/Historial");
const Contador = require("../models/Contador");
const ErrorApp = require("../utils/ErrorApp");

// Calcula la siguiente caja de un pedido y sus piezas (RF-05).
// Devuelve null cuando el pedido ya tiene todas sus etiquetas (RF-22).
const calcularSiguiente = async (pedido) => {
    const usadas = await Etiqueta.find({ pedido: pedido._id }).distinct("caja");

    // Tomamos el número de caja libre más bajo. Así, si se elimina una
    // etiqueta, su número de caja se vuelve a usar y nunca se pasa del total.
    let caja = 1;
    while (usadas.includes(caja)) caja++;

    if (caja > pedido.numeroCajas) return null;

    // Todas las cajas van llenas, excepto la última que lleva el sobrante.
    // Ej.: 520 piezas en cajas de 50 -> 10 cajas de 50 y la caja 11 con 20.
    const piezas = caja === pedido.numeroCajas
        ? pedido.cantidad - pedido.piezasPorCaja * (pedido.numeroCajas - 1)
        : pedido.piezasPorCaja;

    return { caja, piezas };
};

// Recalcula el avance y el estatus del pedido contando sus etiquetas.
// Aquí se cumple RF-15: pasa a "En progreso" con la primera etiqueta.
const actualizarAvance = async (pedidoId) => {
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return;

    pedido.cajasGeneradas = await Etiqueta.countDocuments({ pedido: pedidoId });

    if (pedido.cajasGeneradas === 0) pedido.estatus = "No iniciado";
    else if (pedido.cajasGeneradas < pedido.numeroCajas) pedido.estatus = "En progreso";
    else pedido.estatus = "Terminado";

    await pedido.save();
};

// Guarda en la bitácora quién hizo qué con una etiqueta (RF-21).
const registrarHistorial = (accion, idEtiqueta, detalle, usuario) => {
    return Historial.create({
        accion,
        idEtiqueta,
        detalle,
        numeroEmpleado: usuario.numeroEmpleado,
        nombreEmpleado: usuario.nombre
    });
};

// Busca el pedido o responde 404.
const obtenerPedido = async (pedidoId) => {
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) throw new ErrorApp(404, "El pedido no existe.");
    return pedido;
};

// Asigna a la etiqueta la siguiente caja libre del pedido y la guarda.
// Si otro operador ganó esa caja al mismo tiempo, el índice único
// (pedido + caja) rechaza el guardado y lo intentamos con la siguiente.
const guardarEnSiguienteCaja = async (etiqueta, pedido) => {
    for (let intento = 0; intento < 5; intento++) {
        const siguiente = await calcularSiguiente(pedido);

        if (!siguiente) {
            throw new ErrorApp(409, "El pedido ya tiene todas sus etiquetas generadas.");
        }

        etiqueta.pedido = pedido._id;
        etiqueta.caja = siguiente.caja;
        etiqueta.piezas = siguiente.piezas;

        try {
            return await etiqueta.save();
        } catch (error) {
            if (error.code !== 11000) throw error; // 11000 = valor duplicado
        }
    }
    throw new ErrorApp(409, "No se pudo asignar la caja. Intenta de nuevo.");
};

// Genera y guarda una etiqueta nueva para el pedido (RF-07).
const crearEtiqueta = async (pedidoId, usuario) => {
    const pedido = await obtenerPedido(pedidoId);

    // Revisamos el cupo antes de gastar un folio.
    if (!(await calcularSiguiente(pedido))) {
        throw new ErrorApp(409, "El pedido ya tiene todas sus etiquetas generadas.");
    }

    const etiqueta = new Etiqueta({
        idEtiqueta: await Contador.siguiente("etiqueta"),
        empleado: usuario.id
    });

    await guardarEnSiguienteCaja(etiqueta, pedido);
    await actualizarAvance(pedido._id);
    await registrarHistorial(
        "Generar",
        etiqueta.idEtiqueta,
        `Pedido ${pedido.numeroPedido} (${pedido.producto}), caja ${etiqueta.caja}`,
        usuario
    );

    return etiqueta;
};

// Mueve una etiqueta a otro pedido (editar pedido / cliente / producto).
const cambiarPedido = async (etiqueta, nuevoPedidoId, usuario) => {
    const pedidoAnterior = await obtenerPedido(etiqueta.pedido);
    const pedidoNuevo = await obtenerPedido(nuevoPedidoId);

    if (pedidoAnterior._id.equals(pedidoNuevo._id)) return etiqueta;

    const cajaAnterior = etiqueta.caja;
    await guardarEnSiguienteCaja(etiqueta, pedidoNuevo);

    // Los dos pedidos cambian su avance: uno pierde una caja y otro la gana.
    await actualizarAvance(pedidoAnterior._id);
    await actualizarAvance(pedidoNuevo._id);

    await registrarHistorial(
        "Editar",
        etiqueta.idEtiqueta,
        `Pedido ${pedidoAnterior.numeroPedido} (${pedidoAnterior.producto}), caja ${cajaAnterior} → ` +
        `Pedido ${pedidoNuevo.numeroPedido} (${pedidoNuevo.producto}), caja ${etiqueta.caja}`,
        usuario
    );

    return etiqueta;
};

// Elimina la etiqueta y libera su caja en el pedido.
const eliminarEtiqueta = async (etiqueta, usuario) => {
    const pedido = await Pedido.findById(etiqueta.pedido);

    await etiqueta.deleteOne();
    await actualizarAvance(etiqueta.pedido);
    await registrarHistorial(
        "Eliminar",
        etiqueta.idEtiqueta,
        `Pedido ${pedido?.numeroPedido ?? "?"} (${pedido?.producto ?? "?"}), caja ${etiqueta.caja}`,
        usuario
    );
};

module.exports = {
    calcularSiguiente,
    actualizarAvance,
    registrarHistorial,
    crearEtiqueta,
    cambiarPedido,
    eliminarEtiqueta
};
