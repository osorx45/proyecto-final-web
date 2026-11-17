import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Opciones del menú lateral para cada rol (RF-02).
const MENUS = {
    Operador: [
        { ruta: "/generar", texto: "Generar etiqueta" },
        { ruta: "/reimpresiones", texto: "Reimpresiones" }
    ],
    Administrador: [
        { ruta: "/pedidos", texto: "Pedidos" },
        { ruta: "/empleados", texto: "Empleados" },
        { ruta: "/etiquetas", texto: "Etiquetas" }
    ]
};

// Diseño común de todas las pantallas: encabezado azul y menú lateral.
function Layout({ children }) {
    const { usuario, logout } = useAuth();

    return (
        <div className="app">
            <header className="encabezado">
                Empresa BIC control de etiquetas
            </header>

            <div className="app-cuerpo">
                <aside className="menu">
                    {/* Nombre y rol del usuario en sesión (RF-03) */}
                    <div className="menu-usuario">
                        <strong>{usuario.nombre}</strong>
                        <span>Usuario {usuario.rol}</span>
                        <span>No. {usuario.numeroEmpleado} · Turno {usuario.turno}</span>
                    </div>

                    <nav>
                        {MENUS[usuario.rol].map((opcion) => (
                            <NavLink key={opcion.ruta} to={opcion.ruta} className="menu-opcion">
                                {opcion.texto}
                            </NavLink>
                        ))}
                    </nav>

                    <button className="boton boton-secundario menu-salir" onClick={logout}>
                        Cerrar sesión
                    </button>
                </aside>

                <main className="contenido">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
