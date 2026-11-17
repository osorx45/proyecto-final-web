const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// El inicio con Google es opcional: solo se activa si existe
// FIREBASE_PROJECT_ID en el archivo .env.
const googleActivo = () => Boolean(process.env.FIREBASE_PROJECT_ID);

// Comprueba con los servidores de Google que el token de Firebase sea
// auténtico y pertenezca a nuestro proyecto. Devuelve los datos de la cuenta.
const verificarTokenGoogle = async (idToken) => {
    if (!getApps().length) {
        initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
    return getAuth().verifyIdToken(idToken);
};

module.exports = { googleActivo, verificarTokenGoogle };
