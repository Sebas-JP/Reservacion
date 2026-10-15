
/* =====================================
   RESTAURANTE RATATOULLI
   REGISTRO DE CLIENTES - FRONTEND
   ===================================== */

// Obtener elementos del formulario
const formulario = document.getElementById("form-registro");

const mensaje = document.getElementById("mensaje-registro");

// Escuchar el envío del formulario
formulario.addEventListener("submit", function(event) {

    // Evitar que la página se recargue
    event.preventDefault();

    // Obtener los valores del formulario
    const nombre = document.getElementById("nombre")
        .value.trim();

    const correo = document.getElementById("correo")
        .value.trim();

    const telefono = document.getElementById("telefono")
        .value.trim();

    const contrasena = document.getElementById("contrasena")
        .value;

    const confirmar = document.getElementById(
        "confirmar-contrasena"
    ).value;

    // Limpiar mensajes anteriores
    mensaje.textContent = "";
    mensaje.style.color = "red";

    // VALIDAR NOMBRE
    if (nombre.length < 3) {
        mensaje.textContent =
            "Ingresa un nombre de al menos 3 caracteres.";
        return;
    }

    // VALIDAR CORREO
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo)) {
        mensaje.textContent =
            "Ingresa un correo electrónico válido.";
        return;
    }

    // VALIDAR TELÉFONO DE GUATEMALA
    const telefonoLimpio = telefono.replace(/[\s-]/g, "");

    if (!/^\d{8}$/.test(telefonoLimpio)) {
        mensaje.textContent =
            "El teléfono debe contener 8 dígitos.";
        return;
    }

    // VALIDAR CONTRASEÑA
    if (contrasena.length < 8) {
        mensaje.textContent =
            "La contraseña debe tener al menos 8 caracteres.";
        return;
    }

    // CONFIRMAR CONTRASEÑA
    if (contrasena !== confirmar) {
        mensaje.textContent =
            "Las contraseñas no coinciden.";
        return;
    }

    // =====================================
    // VALIDACIÓN COMPLETADA
    // =====================================

    // IMPORTANTE:
    // Todavía no existe conexión con el backend.
    // No se crean usuarios ni se guardan contraseñas.

    mensaje.style.color = "green";

    mensaje.textContent =
        "Los datos del formulario son válidos. " +
        "Tu cuenta todavía no ha sido creada. " +
        "El registro estará disponible cuando " +
        "se conecte con el servidor.";

    // Mantener los datos para que el usuario
    // pueda revisarlos.
    // No se guardan en localStorage ni sessionStorage.

});
