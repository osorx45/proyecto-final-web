import { apiRequest } from "./api";

// Inicio de sesión con número de empleado y contraseña.
export const iniciarSesion = ({ numeroEmpleado, password }) =>
    apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ numeroEmpleado, password })
    });

// Inicio de sesión con Google: enviamos el token de Firebase al Backend
// y este nos responde con el JWT del sistema.
export const iniciarSesionGoogle = (idToken) =>
    apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken })
    });

// Pregunta al Backend si el inicio con Google está configurado.
export const googleDisponible = async () => {
    try {
        const estado = await apiRequest("/health");
        return Boolean(estado.google);
    } catch {
        return false;
    }
};
