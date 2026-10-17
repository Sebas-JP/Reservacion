/* =====================================
   RESTAURANTE RATATOULLI
   CONFIRMACIÓN DE RESERVACIONES (datos reales del servidor)
   ===================================== */

const contenedor = document.getElementById("datos-confirmacion");
const mensaje = document.getElementById("mensaje-confirmacion");

const guardada = sessionStorage.getItem("reservaConfirmada");

if (!guardada) {
    contenedor.hidden = true;
    mensaje.textContent = "Todavía no hay una reservación para mostrar.";
} else {
    const r = JSON.parse(guardada);

    document.getElementById("codigo").textContent = r.codigo;
    document.getElementById("conf-mesa").textContent = r.mesa;
    document.getElementById("conf-fecha").textContent = r.fecha;
    document.getElementById("conf-hora").textContent = r.hora;
    document.getElementById("conf-personas").textContent = r.personas;
    document.getElementById("conf-preferencia").textContent =
        r.preferencia || "Ninguna";

    contenedor.hidden = false;
    mensaje.textContent =
        "¡Reservación creada! Guarda tu código para presentarlo en el restaurante.";
    mensaje.style.color = "#173b2b";
}