import { createContext, useContext, useMemo, useState } from "react";

import { iniciarSesion, iniciarSesionGoogle } from "../services/authService";
import { obtenerTokenGoogle } from "../services/firebase";

// Contexto de autenticación: comparte la sesión con toda la aplicación.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    // Recuperamos la sesión guardada en esta pestaña (se borra al cerrarla).
    const [token, setToken] = useState(() => sessionStorage.getItem("bic_token"));

    const [usuario, setUsuario] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem("bic_usuario"));
        } catch {
            return null;
        }
    });

    // Guarda el token y el usuario que devuelve el Backend.
    const guardarSesion = (respuesta) => {
        if (!respuesta.token || !respuesta.usuario) {
            throw new Error("El servidor no devolvió los datos de sesión.");
        }

        sessionStorage.setItem("bic_token", respuesta.token);
        sessionStorage.setItem("bic_usuario", JSON.stringify(respuesta.usuario));

        setToken(respuesta.token);
        setUsuario(respuesta.usuario);

        return respuesta.usuario;
    };

    // Inicio con número de empleado y contraseña.
    const login = async (numeroEmpleado, password) =>
        guardarSesion(await iniciarSesion({ numeroEmpleado, password }));

    // Inicio con Google: Firebase identifica la cuenta y el Backend entrega el JWT.
    const loginGoogle = async () =>
        guardarSesion(await iniciarSesionGoogle(await obtenerTokenGoogle()));

    const logout = () => {
        sessionStorage.removeItem("bic_token");
        sessionStorage.removeItem("bic_usuario");
        setToken(null);
        setUsuario(null);
    };

    const valor = useMemo(() => ({
        token,
        usuario,
        login,
        loginGoogle,
        logout,
        autenticado: Boolean(token && usuario)
    }), [token, usuario]);

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook para usar la sesión desde cualquier componente.
export const useAuth = () => {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
    }

    return contexto;
};
