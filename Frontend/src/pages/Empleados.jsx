import { useState } from "react";

import Modal from "../components/Modal";
import TablaDatos from "../components/TablaDatos";
import { useAuth } from "../context/AuthContext";
import { useDatos } from "../hooks/useDatos";
import { apiRequest } from "../services/api";

const COLUMNAS = [
    { clave: "numeroEmpleado", titulo: "Número", tipo: "numero" },
    { clave: "nombre", titulo: "Nombre" },
    { clave: "apellido", titulo: "Apellido" },
    { clave: "turno", titulo: "Turno" },
    { clave: "rol", titulo: "Rol" },
    { clave: "correo", titulo: "Correo de Google" }
];

const EMPLEADO_NUEVO = {
    numeroEmpleado: "",
    nombre: "",
    apellido: "",
    turno: "Matutino",
    rol: "Operador",
    correo: "",
    password: ""
};

// Pantalla del administrador para agregar, editar y eliminar empleados (RF-16).
function Empleados() {
    const { usuario } = useAuth();
    const { datos: empleados, cargando, error, recargar } = useDatos("/empleados");

    // "formulario" es null cuando la ventana está cerrada.
    // Si trae _id se está editando; si no, es un empleado nuevo.
    const [formulario, setFormulario] = useState(null);
    const [errorFormulario, setErrorFormulario] = useState("");
    const [aviso, setAviso] = useState(null);

    const abrir = (empleado) => {
        setErrorFormulario("");
        setFormulario(empleado
            ? { ...empleado, correo: empleado.correo || "", password: "" }
            : EMPLEADO_NUEVO);
    };

    // Actualiza un campo del formulario.
    const cambiar = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

    const guardar = async (e) => {
        e.preventDefault();
        setErrorFormulario("");
        try {
            const editando = Boolean(formulario._id);
            const respuesta = await apiRequest(
                editando ? `/empleados/${formulario._id}` : "/empleados",
                { method: editando ? "PUT" : "POST", body: JSON.stringify(formulario) }
            );
            setFormulario(null);
            setAviso({ tipo: "exito", texto: respuesta.mensaje });
            recargar();
        } catch (err) {
            setErrorFormulario(err.message);
        }
    };

    const eliminar = async (empleado) => {
        if (!window.confirm(`¿Eliminar a ${empleado.nombre} ${empleado.apellido}?`)) return;
        try {
            await apiRequest(`/empleados/${empleado._id}`, { method: "DELETE" });
            setAviso({ tipo: "exito", texto: "Empleado eliminado." });
            recargar();
        } catch (err) {
            setAviso({ tipo: "error", texto: err.message });
        }
    };

    return (
        <>
            <div className="titulo-fila">
                <h1 className="titulo">Empleados</h1>
                <button className="boton" onClick={() => abrir(null)}>Agregar empleado</button>
            </div>

            {(error || aviso) && (
                <div className={`aviso aviso-${error ? "error" : aviso.tipo}`}>{error || aviso.texto}</div>
            )}

            {cargando ? <p>Cargando empleados...</p> : (
                <TablaDatos
                    columnas={COLUMNAS}
                    filas={empleados}
                    acciones={(empleado) => (
                        <>
                            <button className="boton boton-secundario boton-chico" onClick={() => abrir(empleado)}>Editar</button>
                            {/* Nadie puede eliminar su propio usuario */}
                            <button
                                className="boton boton-peligro boton-chico"
                                disabled={empleado._id === usuario.id}
                                onClick={() => eliminar(empleado)}
                            >
                                Eliminar
                            </button>
                        </>
                    )}
                />
            )}

            {formulario && (
                <Modal titulo={formulario._id ? "Editar empleado" : "Agregar empleado"} onCerrar={() => setFormulario(null)}>
                    <form className="formulario" onSubmit={guardar}>
                        <label>
                            Número de empleado
                            <input name="numeroEmpleado" type="number" min="1" step="1" value={formulario.numeroEmpleado} onChange={cambiar} required />
                        </label>

                        <div className="formulario-dos">
                            <label>
                                Nombre
                                <input name="nombre" value={formulario.nombre} onChange={cambiar} required />
                            </label>
                            <label>
                                Apellido
                                <input name="apellido" value={formulario.apellido} onChange={cambiar} required />
                            </label>
                        </div>

                        <div className="formulario-dos">
                            <label>
                                Turno
                                <select name="turno" value={formulario.turno} onChange={cambiar}>
                                    <option>Matutino</option>
                                    <option>Vespertino</option>
                                    <option>Nocturno</option>
                                </select>
                            </label>
                            <label>
                                Rol
                                <select name="rol" value={formulario.rol} onChange={cambiar}>
                                    <option>Operador</option>
                                    <option>Administrador</option>
                                </select>
                            </label>
                        </div>

                        <label>
                            Contraseña {formulario._id && "(déjala vacía para no cambiarla)"}
                            <input
                                name="password"
                                type="password"
                                minLength={6}
                                autoComplete="new-password"
                                value={formulario.password}
                                onChange={cambiar}
                                required={!formulario._id}
                            />
                        </label>

                        <label>
                            Correo de Google (opcional, para "Entrar con Google")
                            <input name="correo" type="email" value={formulario.correo} onChange={cambiar} />
                        </label>

                        {errorFormulario && <div className="aviso aviso-error">{errorFormulario}</div>}

                        <div className="modal-botones">
                            <button type="button" className="boton boton-secundario" onClick={() => setFormulario(null)}>Cancelar</button>
                            <button type="submit" className="boton">Guardar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

export default Empleados;
