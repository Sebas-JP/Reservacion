
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

formularioLogin.addEventListener("submit", async function(event) {

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
    // ENVIAR LOGIN AL SERVIDOR
    // =====================================

    const boton = formularioLogin.querySelector("button[type='submit']");
    if (boton) boton.disabled = true;

    try {
        const respuesta = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensajeLogin.textContent =
                datos.mensaje || datos.error || "No se pudo iniciar sesión.";
            if (boton) boton.disabled = false;
            return;
        }

        // Un administrador debe entrar por su propia pantalla
        if (datos.usuario.rol === "admin") {
            mensajeLogin.textContent =
                "Esta cuenta es de administrador. Usa el acceso administrativo.";
            if (boton) boton.disabled = false;
            return;
        }

        // Guardar la sesión (mismos nombres que usa el login de admin)
        localStorage.setItem("token", datos.token);
        localStorage.setItem("usuario", JSON.stringify(datos.usuario));

        mensajeLogin.style.color = "green";
        mensajeLogin.textContent = "Inicio de sesión correcto. Redirigiendo...";

        // Si el cliente venía de elegir una mesa, seguir a reservas
        // con esa mesa; si no, ir al catálogo de mesas.
        const mesa = sessionStorage.getItem("mesaSeleccionada");
        window.location.href = mesa
            ? "reservas.html?mesa=" + encodeURIComponent(mesa)
            : "mesas.html";

    } catch (error) {
        mensajeLogin.textContent =
            "No se pudo conectar con el servidor. Intenta de nuevo.";
        if (boton) boton.disabled = false;
    }

});