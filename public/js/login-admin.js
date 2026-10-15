
// ======================================
// RESTAURANTE RATATOULLI
// LOGIN ADMINISTRATIVO - FRONTEND
// ======================================

const formularioAdmin = document.getElementById(
    "form-login-admin"
);

const correoAdmin = document.getElementById(
    "correo-admin"
);

const contrasenaAdmin = document.getElementById(
    "contrasena-admin"
);

const verClaveAdmin = document.getElementById(
    "ver-clave-admin"
);

const mensajeAdmin = document.getElementById(
    "mensaje-admin"
);

// MOSTRAR Y OCULTAR CONTRASEÑA

verClaveAdmin.addEventListener("change", function() {

    if (verClaveAdmin.checked) {
        contrasenaAdmin.type = "text";
    } else {
        contrasenaAdmin.type = "password";
    }

});

// VALIDAR FORMULARIO

formularioAdmin.addEventListener("submit", function(event) {

    event.preventDefault();

    const correo = correoAdmin.value.trim();
    const contrasena = contrasenaAdmin.value;

    mensajeAdmin.style.color = "red";

    // Validar correo electrónico
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo)) {

        mensajeAdmin.textContent =
            "Ingrese un correo electrónico válido.";

        return;
    }

    // Validar contraseña
    if (contrasena.trim().length === 0) {

        mensajeAdmin.textContent =
            "Debe ingresar su contraseña.";

        return;
    }

    // DEMOSTRACIÓN
    // La verificación real corresponde al backend.
    // No se concede acceso administrativo.

    mensajeAdmin.style.color = "#173b2b";

    mensajeAdmin.textContent =
        "Formulario validado. " +
        "El acceso administrativo estará disponible " +
        "cuando se implemente la autenticación del servidor.";

});
