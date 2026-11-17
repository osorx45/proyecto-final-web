// Valores generales del sistema reunidos en un solo lugar.

module.exports = {
    // Duración de un turno en horas. Se usa para:
    //  - la vigencia del token JWT (la sesión dura un turno),
    //  - saber qué etiquetas son "del turno" del operador (reporte y eliminar).
    HORAS_TURNO: 8,

    // Piezas por caja cuando el archivo importado no trae ese dato.
    PIEZAS_POR_CAJA_DEFAULT: 50,

    // Zona horaria con la que se imprimen las fechas en los PDF y el Excel.
    ZONA_HORARIA: process.env.ZONA_HORARIA || "America/Mexico_City"
};
