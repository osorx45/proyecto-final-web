import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { rutaInicial } from "../components/ProtectedRoute";
import { googleDisponible } from "../services/authService";
import { firebaseConfigurado } from "../services/firebase";

function Login() {
    const { login, loginGoogle, autenticado, usuario } = useAuth();
    const navigate = useNavigate();

    const [numeroEmpleado, setNumeroEmpleado] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mostrarGoogle, setMostrarGoogle] = useState(false);

    // El botón de Google aparece solo si está configurado en Frontend y Backend.
    useEffect(() => {
        if (firebaseConfigurado) googleDisponible().then(setMostrarGoogle);
    }, []);

    // Si ya hay sesión no tiene sentido mostrar el login.
    if (autenticado) {
        return <Navigate to={rutaInicial(usuario.rol)} replace />;
    }

    // Ejecuta cualquiera de los dos inicios de sesión y entra al sistema.
    const entrar = async (iniciar) => {
        setError("");
        setCargando(true);
        try {
            const usuarioNuevo = await iniciar();
            navigate(rutaInicial(usuarioNuevo.rol), { replace: true });
        } catch (e) {
            // Cerrar la ventana de Google no es un error que haya que mostrar.
            if (e.code !== "auth/popup-closed-by-user") setError(e.message);
            setCargando(false);
        }
    };

    const manejarFormulario = (e) => {
        e.preventDefault();
        entrar(() => login(numeroEmpleado.trim(), password));
    };

    return (
        <main className="login-page">
            <section className="login-card">
                <span className="login-label">SISTEMA BIC</span>

                <h1>Bienvenido</h1>

                <p className="login-description">
                    Ingresa tus datos para acceder al sistema de control de etiquetas.
                </p>

                <form onSubmit={manejarFormulario}>
                    <label htmlFor="numeroEmpleado">Número de empleado</label>
                    <input
                        id="numeroEmpleado"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]+"
                        title="Solo números"
                        placeholder="Ej. 1"
                        value={numeroEmpleado}
                        onChange={(e) => setNumeroEmpleado(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                    />

                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && <div className="login-error" role="alert">{error}</div>}

                    <button type="submit" disabled={cargando}>
                        {cargando ? "Verificando..." : "Iniciar sesión"}
                    </button>
                </form>

                {mostrarGoogle && (
                    <button
                        type="button"
                        className="login-google"
                        disabled={cargando}
                        onClick={() => entrar(loginGoogle)}
                    >
                        Entrar con Google
                    </button>
                )}

                <p className="login-footer">Empresa BIC control de etiquetas</p>
            </section>
        </main>
    );
}

export default Login;
