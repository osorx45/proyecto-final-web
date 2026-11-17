require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const conectarDB = require("../config/database");
const Empleado = require("../models/Empleado");

/*
  Crea el primer administrador del sistema. Se ejecuta con: npm run seed:admin

  Variables del archivo .env que utiliza:
    ADMIN_NUMERO    número de empleado para iniciar sesión (por defecto 1)
    ADMIN_PASSWORD  contraseña inicial
    ADMIN_EMAIL     (opcional) correo de Google del administrador
*/
const crearAdministrador = async () => {
    try {
        await conectarDB();

        const numeroEmpleado = Number(process.env.ADMIN_NUMERO || 1);
        const password = process.env.ADMIN_PASSWORD;
        const correo = (process.env.ADMIN_EMAIL || "").toLowerCase().trim() || undefined;

        if (!password) {
            throw new Error("Falta ADMIN_PASSWORD en el archivo .env.");
        }

        // Si ya existe (por número o por correo) solo completamos sus datos.
        // Esto actualiza al administrador creado con la versión anterior,
        // que iniciaba sesión con correo y no tenía número de empleado.
        const existente = await Empleado.findOne({
            $or: [{ numeroEmpleado }, ...(correo ? [{ correo }] : [])]
        });

        if (existente) {
            existente.numeroEmpleado = existente.numeroEmpleado || numeroEmpleado;
            existente.apellido = existente.apellido || "BIC";
            await existente.save();
            console.log(`El administrador ya existe. Número de empleado: ${existente.numeroEmpleado}`);
            return;
        }

        await Empleado.create({
            numeroEmpleado,
            nombre: "Administrador",
            apellido: "BIC",
            turno: "Matutino",
            correo,
            password: await bcrypt.hash(password, 12),
            rol: "Administrador"
        });

        console.log(`Administrador creado. Número de empleado: ${numeroEmpleado}`);
    } catch (error) {
        console.error("Error al crear administrador:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

crearAdministrador();
