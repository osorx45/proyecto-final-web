
import { useAuth } from "../context/AuthContext";

function Dashboard() {

    const { usuario, logout } = useAuth();

    const esAdministrador = usuario?.rol === "Administrador";

    return (

        <main className="dashboard-page">

            <header className="dashboard-header">

                <div>
                    <span className="login-label">
                        SISTEMA BIC
                    </span>

                    <h1>
                        {esAdministrador
                            ? "Panel de Administrador"
                            : "Panel de Operador"}
                    </h1>
                </div>

                <button
                    className="logout-button"
                    onClick={logout}
                >
                    Cerrar sesión
                </button>

            </header>

            <section className="dashboard-content">

                <div className="dashboard-welcome">

                    <h2>
                        ¡Hola, {usuario?.nombre}!
                    </h2>

                    <p>
                        Has iniciado sesión correctamente
                        en el sistema BIC.
                    </p>

                    <p>
                        Correo: {usuario?.correo}
                    </p>

                    <p>
                        Rol: {usuario?.rol}
                    </p>

                </div>

                <div className="dashboard-modules">

                    {esAdministrador ? (

                        <>
                            <h2>Administración</h2>

                            <p>Desde aquí podrás acceder a los módulos de:</p>

                            <ul>
                                <li>Gestión de empleados.</li>
                                <li>Gestión de productos.</li>
                                <li>Gestión de pedidos.</li>
                                <li>Control de etiquetas.</li>
                                <li>Reportes e historial.</li>
                            </ul>
                        </>

                    ) : (

                        <>
                            <h2>Operaciones</h2>

                            <p>Desde aquí podrás acceder a los módulos de:</p>

                            <ul>
                                <li>Consulta de productos.</li>
                                <li>Consulta de pedidos.</li>
                                <li>Registro y control de etiquetas.</li>
                            </ul>
                        </>

                    )}

                </div>

            </section>

        </main>
    );
}

export default Dashboard;
