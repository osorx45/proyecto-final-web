
/*
  Inicialización de la base de datos BIC.

  Este archivo lo ejecuta MongoDB automáticamente cuando
  se crea por primera vez el volumen de datos.
*/

// Seleccionamos la base de datos de nuestra aplicación.
db = db.getSiblingDB("bic_db");

// Comprobamos si el usuario ya existe.
// Esto evita intentar crearlo dos veces.
const usuarioExiste = db.getUser("bic_app");

if (!usuarioExiste) {
    db.createUser({
        user: "bic_app",

        // La contraseña llega desde las variables de entorno.
        pwd: process.env.BIC_DB_PASSWORD,

        // El usuario solo tendrá permisos de lectura y escritura
        // dentro de la base de datos bic_db.
        roles: [
            {
                role: "readWrite",
                db: "bic_db"
            }
        ]
    });

    print("Usuario de BIC creado correctamente.");
} else {
    print("El usuario de BIC ya existe.");
}
