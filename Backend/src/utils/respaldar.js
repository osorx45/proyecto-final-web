require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const conectarDB = require("../config/database");

/*
  Respaldo de la base de datos (RNF-06). Se ejecuta con: npm run backup
  Guarda cada colección como archivo JSON dentro de respaldos/<fecha>/.
  En el servidor se programa una vez al día (ver la guía de despliegue).
*/
const respaldar = async () => {
    try {
        await conectarDB();

        const fecha = new Date().toISOString().slice(0, 10); // aaaa-mm-dd
        const carpeta = path.join(__dirname, "..", "..", "respaldos", fecha);
        fs.mkdirSync(carpeta, { recursive: true });

        for (const [nombre, modelo] of Object.entries(mongoose.models)) {
            const documentos = await modelo.find().lean();
            fs.writeFileSync(
                path.join(carpeta, `${nombre}.json`),
                JSON.stringify(documentos, null, 2)
            );
            console.log(`${nombre}: ${documentos.length} documento(s).`);
        }

        console.log(`Respaldo guardado en ${carpeta}`);
    } catch (error) {
        console.error("Error al respaldar:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

respaldar();
