/* =====================================
   RESTAURANTE RATATOULLI
   SELECCIÓN DE MESAS (conectado a la API)
   ===================================== */

const detalle = document.getElementById("detalle-mesa");
const titulo = document.getElementById("titulo-mesa");
const capacidad = document.getElementById("capacidad-mesa");
const enlace = document.getElementById("enlace-reserva");

const zonas = {
    interior: document.getElementById("zona-interior"),
    terraza: document.getElementById("zona-terraza")
};

function crearBoton(mesa) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "mesa-plano " + mesa.estado;
    boton.dataset.mesa = mesa.numero;
    boton.dataset.capacidad = mesa.capacidad;

    boton.textContent = "Mesa " + mesa.numero;
    const detalleCap = document.createElement("small");
    detalleCap.textContent = mesa.capacidad + " personas";
    boton.appendChild(detalleCap);

    // Solo se pueden elegir las mesas libres
    if (mesa.estado !== "libre") boton.disabled = true;

    return boton;
}

async function cargarMesas() {
    try {
        const respuesta = await fetch("/api/mesas");
        if (!respuesta.ok) throw new Error("Respuesta inválida");
        const mesas = await respuesta.json();

        mesas.forEach(function (mesa) {
            const zona = zonas[mesa.ubicacion];
            if (zona) zona.appendChild(crearBoton(mesa));
        });
    } catch (error) {
        zonas.interior.textContent =
            "No se pudieron cargar las mesas. Intenta de nuevo más tarde.";
    }
}

// Un solo listener para todas las mesas (incluso las creadas después)
document.querySelector(".plano").addEventListener("click", function (evento) {
    const mesa = evento.target.closest(".mesa-plano.libre");
    if (!mesa) return;

    document.querySelectorAll(".mesa-plano").forEach(function (otra) {
        otra.classList.remove("seleccionada");
    });
    mesa.classList.add("seleccionada");

    const numero = mesa.dataset.mesa;
    titulo.textContent = "Mesa " + numero;
    capacidad.textContent = "Capacidad: " + mesa.dataset.capacidad + " personas";

    // Guardar temporalmente la mesa elegida (no es una sesión)
    sessionStorage.setItem("mesaSeleccionada", numero);

    enlace.href = "acceso-reserva.html?mesa=" + encodeURIComponent(numero);
    detalle.hidden = false;
});

cargarMesas();