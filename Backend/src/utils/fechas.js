const { ZONA_HORARIA, HORAS_TURNO } = require("../config/constantes");

// Convierte una fecha a texto "12/05/2025 12:00" en la zona horaria del sistema.
// Es necesario porque el servidor (Docker) trabaja en horario UTC.
const formatearFecha = (fecha, conHora = true) => {
    if (!fecha) return "";
    return new Intl.DateTimeFormat("es-MX", {
        timeZone: ZONA_HORARIA,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(conHora ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
    }).format(new Date(fecha)).replace(",", "");
};

// Momento en que empezó el turno actual: hace HORAS_TURNO horas.
const inicioDelTurno = () => new Date(Date.now() - HORAS_TURNO * 60 * 60 * 1000);

module.exports = { formatearFecha, inicioDelTurno };
