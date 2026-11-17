// Envía un PDF directo a la impresora: lo carga en un marco oculto
// y abre el cuadro de impresión del navegador.
export const imprimirPdf = (blob) => {
    const url = URL.createObjectURL(blob);

    document.getElementById("marco-impresion")?.remove();

    const marco = document.createElement("iframe");
    marco.id = "marco-impresion";
    marco.style.display = "none";
    marco.src = url;

    marco.onload = () => {
        try {
            marco.contentWindow.focus();
            marco.contentWindow.print();
        } catch {
            // Si el navegador no deja imprimir así, abrimos el PDF en otra pestaña.
            window.open(url, "_blank");
        }
    };

    document.body.appendChild(marco);
};

// Descarga un archivo (Blob) con el nombre indicado.
export const descargarArchivo = (blob, nombre) => {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Muestra una fecha como "12/05/2025 12:00" (o sin hora).
export const formatearFecha = (fecha, conHora = true) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(conHora ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
    }).replace(",", "");
};
