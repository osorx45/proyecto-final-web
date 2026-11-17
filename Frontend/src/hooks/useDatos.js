import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// Hook para cargar una lista desde la API.
// Devuelve los datos, si está cargando, el error y una función para recargar.
export const useDatos = (endpoint) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const recargar = useCallback(async () => {
        try {
            setDatos(await apiRequest(endpoint));
            setError("");
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, [endpoint]);

    // Carga inicial al abrir la pantalla.
    useEffect(() => {
        recargar();
    }, [recargar]);

    return { datos, cargando, error, recargar };
};
