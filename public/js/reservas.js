/* =====================================
   RESTAURANTE RATATOULLI
   FORMULARIO DE RESERVACIONES (conectado a la API)
   ===================================== */

const infoMesa = document.getElementById("info-mesa");
const formulario = document.getElementById("form-reserva");
const personas = document.getElementById("personas");
const fecha = document.getElementById("fecha");
const mensaje = document.getElementById("mensaje-reserva");
const enlaceAcceso = document.getElementById("enlace-acceso-reserva");

const token = localStorage.getItem("token");

// Sin sesión: ir a iniciar sesión conservando la mesa
const parametros = new URLSearchParams(window.location.search);
let numeroMesa = parametros.get("mesa") || sessionStorage.getItem("mesaSeleccionada");

if (!token) {
    window.location.href = numeroMesa
        ? "login.html?mesa=" + encodeURIComponent(numeroMesa)
        : "login.html";
}

function fechaLocal(date) {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}
fecha.min = fechaLocal(new Date());

let mesaActual = null;

async function cargarMesa() {
    if (!numeroMesa) {
        infoMesa.textContent = "Primero selecciona una mesa desde el plano.";
        formulario.hidden = true;
        return;
    }
    try {
        const respuesta = await fetch("/api/mesas");
        const mesas = await respuesta.json();
        mesaActual = mesas.find(function (m) {
            return String(m.numero) === String(numeroMesa);
        });
    } catch (error) {
        infoMesa.textContent = "No se pudo conectar con el servidor.";
        formulario.hidden = true;
        return;
    }

    if (!mesaActual) {
        infoMesa.textContent = "La mesa seleccionada no existe.";
        formulario.hidden = true;
        return;
    }

    sessionStorage.setItem("mesaSeleccionada", numeroMesa);
    const ubicacion = mesaActual.ubicacion === "terraza" ? "Terraza" : "Interior";
    infoMesa.textContent =
        `Mesa ${mesaActual.numero} | ${ubicacion} | Capacidad: ${mesaActual.capacidad} personas`;
    personas.max = mesaActual.capacidad;

    if (enlaceAcceso) {
        enlaceAcceso.href = "acceso-reserva.html?mesa=" + encodeURIComponent(numeroMesa);
    }
}
cargarMesa();

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    mensaje.textContent = "";
    mensaje.style.color = "red";

    if (!mesaActual) {
        mensaje.textContent = "Selecciona primero una mesa disponible.";
        return;
    }

    const cantidad = Number(personas.value);
    const hora = document.getElementById("hora").value;
    const preferencia = document.getElementById("preferencia").value.trim();

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > mesaActual.capacidad) {
        mensaje.textContent =
            `La Mesa ${mesaActual.numero} admite entre 1 y ${mesaActual.capacidad} personas.`;
        return;
    }
    if (!fecha.value || !hora) {
        mensaje.textContent = "Selecciona una fecha y una hora.";
        return;
    }
    const fechaHora = new Date(`${fecha.value}T${hora}:00`);
    if (Number.isNaN(fechaHora.getTime()) || fechaHora <= new Date()) {
        mensaje.textContent = "Selecciona una fecha y hora futuras.";
        return;
    }

    const boton = formulario.querySelector("button[type='submit']");
    boton.disabled = true;

    try {
        const respuesta = await fetch("/api/reservas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                mesa_id: mesaActual.id,
                fecha: fecha.value,
                hora: hora,
                personas: cantidad,
                preferencia: preferencia
            })
        });
        const datos = await respuesta.json();

        // Token vencido o inválido: volver a iniciar sesión
        if (respuesta.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "login.html?mesa=" + encodeURIComponent(numeroMesa);
            return;
        }

        if (!respuesta.ok) {
            mensaje.textContent = datos.error || datos.mensaje || "No se pudo crear la reserva.";
            boton.disabled = false;
            return;
        }

        // Guardar la reserva real para mostrarla en la confirmación
        sessionStorage.setItem("reservaConfirmada", JSON.stringify(datos));
        sessionStorage.removeItem("mesaSeleccionada");
        window.location.href = "confirmacion.html";

    } catch (error) {
        mensaje.textContent = "No se pudo conectar con el servidor. Intenta de nuevo.";
        boton.disabled = false;
    }
});