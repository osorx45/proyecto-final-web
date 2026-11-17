import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute, { rutaInicial } from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import GenerarEtiqueta from "./pages/GenerarEtiqueta";
import Reimpresiones from "./pages/Reimpresiones";
import Pedidos from "./pages/Pedidos";
import Empleados from "./pages/Empleados";
import Etiquetas from "./pages/Etiquetas";

// Redirige a la pantalla inicial según el rol (o al login si no hay sesión).
function Inicio() {
    const { autenticado, usuario } = useAuth();
    return <Navigate to={autenticado ? rutaInicial(usuario.rol) : "/login"} replace />;
}

// Atajo: pantalla protegida para un rol, dentro del diseño con menú.
const pantalla = (rol, componente) => (
    <ProtectedRoute roles={[rol]}>
        <Layout>{componente}</Layout>
    </ProtectedRoute>
);

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Pantallas del Operador */}
                <Route path="/generar" element={pantalla("Operador", <GenerarEtiqueta />)} />
                <Route path="/reimpresiones" element={pantalla("Operador", <Reimpresiones />)} />

                {/* Pantallas del Administrador */}
                <Route path="/pedidos" element={pantalla("Administrador", <Pedidos />)} />
                <Route path="/empleados" element={pantalla("Administrador", <Empleados />)} />
                <Route path="/etiquetas" element={pantalla("Administrador", <Etiquetas />)} />

                {/* Cualquier otra dirección */}
                <Route path="*" element={<Inicio />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
