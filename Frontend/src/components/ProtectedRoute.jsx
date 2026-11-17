import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Pantalla inicial de cada rol.
export const rutaInicial = (rol) => (rol === "Administrador" ? "/pedidos" : "/generar");

// Envuelve las pantallas que requieren sesión (RNF-02).
// "roles" limita la pantalla a ciertos roles.
function ProtectedRoute({ children, roles }) {
    const { autenticado, usuario } = useAuth();

    // Sin sesión: al login.
    if (!autenticado) {
        return <Navigate to="/login" replace />;
    }

    // Con sesión pero sin el rol necesario: a la pantalla inicial de su rol.
    if (roles && !roles.includes(usuario?.rol)) {
        return <Navigate to={rutaInicial(usuario?.rol)} replace />;
    }

    return children;
}

export default ProtectedRoute;
