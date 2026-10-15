
/* =====================================
   RESTAURANTE RATATOULLI
   LOGIN DE CLIENTES - FRONTEND
   ===================================== */

// OBTENER ELEMENTOS DEL FORMULARIO

const formularioLogin = document.getElementById(
    "form-login"
);

const mensajeLogin = document.getElementById(
    "mensaje-login"
);

const correoLogin = document.getElementById(
    "correo-login"
);

const contrasenaLogin = document.getElementById(
    "contrasena-login"
);

const verContrasena = document.getElementById(
    "ver-contrasena"
);

// =====================================
// MOSTRAR U OCULTAR CONTRASEÑA
// =====================================

verContrasena.addEventListener("change", function() {

    if (verContrasena.checked) {
        contrasenaLogin.type = "text";
    } else {
        contrasenaLogin.type = "password";
    }

});

// =====================================
// VALIDAR FORMULARIO
// =====================================

formularioLogin.addEventListener("submit", function(event) {

    // Evitar que se recargue la página
    event.preventDefault();

    // Obtener los valores
    const correo = correoLogin.value.trim();
    const contrasena = contrasenaLogin.value;

    // Limpiar mensaje anterior
    mensajeLogin.textContent = "";
    mensajeLogin.style.color = "red";

    // VALIDAR CORREO

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo)) {

        mensajeLogin.textContent =
            "Ingresa un correo electrónico válido.";

        return;
    }

    // VALIDAR CONTRASEÑA

    if (contrasena.trim().length === 0) {

        mensajeLogin.textContent =
            "Debes ingresar tu contraseña.";

        return;
    }

    // =====================================
    // LOGIN PENDIENTE DE BACKEND
    // =====================================

    // Aquí se conectará posteriormente
    // la autenticación real del servidor.
    //
    // El backend deberá:
    // 1. Verificar el correo y la contraseña.
    // 2. Identificar al cliente.
    // 3. Crear una sesión segura.
    // 4. Autorizar el acceso a reservaciones.
    //
    // No guardamos contraseñas en el navegador.
    // No simulamos que el cliente inició sesión.

    mensajeLogin.style.color = "green";

    mensajeLogin.textContent =
        "Los datos del formulario son válidos. " +
        "El inicio de sesión todavía no está disponible. " +
        "Falta conectar la autenticación con el servidor.";

    // =====================================
    // MESA SELECCIONADA
    // =====================================

    // La mesa ya está conservada mediante
    // login-mesa.js y sessionStorage.
    //
    // Cuando el backend confirme que el cliente
    // inició sesión correctamente, se podrá
    // recuperar la mesa y continuar a reservas.html.
    //
    // No redirigimos todavía porque no existe
    // una sesión autenticada real.

});
