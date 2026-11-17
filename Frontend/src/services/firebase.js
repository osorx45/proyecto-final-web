import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "firebase/auth";

// Datos del proyecto de Firebase. Se copian de la consola de Firebase
// al archivo .env (ver la guía). No son secretos: identifican al proyecto.
const configuracion = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// El botón de Google solo aparece si Firebase está configurado.
export const firebaseConfigurado = Boolean(configuracion.apiKey);

// Abre la ventana de Google y devuelve el token que identifica a la cuenta.
export const obtenerTokenGoogle = async () => {
    const auth = getAuth(initializeApp(configuracion));

    const resultado = await signInWithPopup(auth, new GoogleAuthProvider());
    const idToken = await resultado.user.getIdToken();

    // Cerramos la sesión de Firebase: a partir de aquí usamos nuestro JWT.
    await signOut(auth);

    return idToken;
};
