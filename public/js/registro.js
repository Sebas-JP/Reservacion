
/* =====================================
   RESTAURANTE RATATOULLI
   REGISTRO DE CLIENTES - FRONTEND
   ===================================== */

// Obtener elementos del formulario
const formulario = document.getElementById("form-registro");

const mensaje = document.getElementById("mensaje-registro");

// Escuchar el envío del formulario
formulario.addEventListener("submit", async function(event) {

    // Evitar que la página se recargue
    event.preventDefault();

    // Obtener los valores del formulario
    const nombre = document.getElementById("nombre")
        .value.trim();

    const correo = document.getElementById("correo")
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
    // ENVIAR REGISTRO AL SERVIDOR
    // =====================================

    const boton = formulario.querySelector("button[type='submit']");
    boton.disabled = true;

    try {
        const respuesta = await fetch("/api/auth/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, correo, contrasena })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            // El servidor responde con "mensaje" (auth) o "error" (otras rutas)
            mensaje.textContent =
                datos.mensaje || datos.error || "No se pudo crear la cuenta.";
            boton.disabled = false;
            return;
        }

        mensaje.style.color = "green";
        mensaje.textContent =
            "Cuenta creada correctamente. Redirigiendo al inicio de sesión...";

        // Ir a login.html (si hay mesa seleccionada, registro-mesa.js
        // ya actualiza el enlace con el número de mesa)
        setTimeout(function () {
            const enlace = document.getElementById("enlace-login-registro");
            window.location.href = enlace ? enlace.href : "login.html";
        }, 1500);

    } catch (error) {
        mensaje.textContent =
            "No se pudo conectar con el servidor. Intenta de nuevo.";
        boton.disabled = false;
    }

});