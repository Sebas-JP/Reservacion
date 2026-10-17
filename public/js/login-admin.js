
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

formularioAdmin.addEventListener("submit", async function(event) {

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

        // ENVIAR AL SERVIDOR

    const boton = formularioAdmin.querySelector("button[type='submit']");
    if (boton) boton.disabled = true;

    try {
        const respuesta = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensajeAdmin.textContent =
                datos.mensaje || datos.error || "No se pudo iniciar sesión.";
            if (boton) boton.disabled = false;
            return;
        }

        // Solo los administradores pueden entrar a este panel
        if (datos.usuario.rol !== "admin") {
            mensajeAdmin.textContent =
                "Esta cuenta no tiene permisos de administrador.";
            if (boton) boton.disabled = false;
            return;
        }

        localStorage.setItem("token", datos.token);
        localStorage.setItem("usuario", JSON.stringify(datos.usuario));

        mensajeAdmin.style.color = "#173b2b";
        mensajeAdmin.textContent = "Acceso concedido. Redirigiendo...";

        window.location.href = "admin.html";

    } catch (error) {
        mensajeAdmin.textContent =
            "No se pudo conectar con el servidor. Intenta de nuevo.";
        if (boton) boton.disabled = false;
    }

});
