// Dirección de la API. Se define en el archivo .env (VITE_API_URL).
const API_URL = import.meta.env.VITE_API_URL;

// Función base para todas las peticiones al Backend.
// Agrega el token JWT y convierte los errores en mensajes legibles.
const peticion = async (endpoint, options = {}) => {
    const token = sessionStorage.getItem("bic_token");

    // Si enviamos un archivo (FormData) el navegador pone solo el Content-Type.
    const esArchivo = options.body instanceof FormData;

    let respuesta;
    try {
        respuesta = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...(esArchivo ? {} : { "Content-Type": "application/json" }),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers
            }
        });
    } catch {
        throw new Error("No fue posible conectar con el servidor BIC.");
    }

    // 401 con sesión abierta = el token expiró: cerramos sesión y vamos al login.
    if (respuesta.status === 401 && token) {
        sessionStorage.removeItem("bic_token");
        sessionStorage.removeItem("bic_usuario");
        window.location.assign("/login");
    }

    if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        const error = new Error(datos.mensaje || `Error del servidor: ${respuesta.status}`);
        error.datos = datos; // por si la pantalla necesita más detalle
        throw error;
    }

    return respuesta;
};

// Peticiones que responden JSON (la mayoría).
export const apiRequest = async (endpoint, options = {}) => {
    const respuesta = await peticion(endpoint, options);
    return respuesta.json().catch(() => ({}));
};

// Peticiones que responden un archivo (PDF o Excel). Devuelve un Blob.
export const apiArchivo = async (endpoint, options = {}) => {
    const respuesta = await peticion(endpoint, options);
    return respuesta.blob();
};
