import { useState } from "react";

/*
  Tres listas desplegables encadenadas (RF-04, RF-08):
  cliente -> pedidos de ese cliente -> productos de ese pedido.

  Props:
    pedidos:   lista de /pedidos/opciones (cada elemento es pedido + producto)
    inicial:   id del pedido que debe aparecer seleccionado (al editar)
    onCambio:  recibe el pedido elegido, o null si la selección está incompleta
*/
function SelectorPedido({ pedidos, inicial, onCambio }) {
    const pedidoInicial = pedidos.find((p) => p._id === inicial);

    const [cliente, setCliente] = useState(pedidoInicial?.cliente || "");
    const [numeroPedido, setNumeroPedido] = useState(pedidoInicial?.numeroPedido || "");
    const [pedidoId, setPedidoId] = useState(pedidoInicial?._id || "");

    // Opciones de cada lista, sin repetidos.
    const clientes = [...new Set(pedidos.map((p) => p.cliente))];
    const numeros = [...new Set(pedidos.filter((p) => p.cliente === cliente).map((p) => p.numeroPedido))];
    const productos = pedidos.filter((p) => p.cliente === cliente && p.numeroPedido === numeroPedido);

    // Al cambiar una lista se limpian las que dependen de ella.
    const elegirCliente = (valor) => {
        setCliente(valor);
        setNumeroPedido("");
        setPedidoId("");
        onCambio(null);
    };

    const elegirNumero = (valor) => {
        setNumeroPedido(valor);
        setPedidoId("");
        onCambio(null);
    };

    const elegirProducto = (id) => {
        setPedidoId(id);
        onCambio(pedidos.find((p) => p._id === id) || null);
    };

    return (
        <div className="formulario">
            <label>
                Cliente
                <select value={cliente} onChange={(e) => elegirCliente(e.target.value)}>
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((c) => <option key={c}>{c}</option>)}
                </select>
            </label>

            <label>
                Pedido
                <select value={numeroPedido} disabled={!cliente} onChange={(e) => elegirNumero(e.target.value)}>
                    <option value="">Selecciona un pedido</option>
                    {numeros.map((n) => <option key={n}>{n}</option>)}
                </select>
            </label>

            <label>
                Producto
                <select value={pedidoId} disabled={!numeroPedido} onChange={(e) => elegirProducto(e.target.value)}>
                    <option value="">Selecciona un producto</option>
                    {productos.map((p) => (
                        // Un producto con todas sus etiquetas ya no se puede elegir (RF-22).
                        <option key={p._id} value={p._id} disabled={p.estatus === "Terminado" && p._id !== inicial}>
                            {p.producto} ({p.cajasGeneradas}/{p.numeroCajas} cajas)
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}

export default SelectorPedido;
