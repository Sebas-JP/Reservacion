
/* =====================================
   RESTAURANTE RATATOULLI
   SELECCIÓN DE MESAS
   ===================================== */

// Obtener todas las mesas disponibles
const mesasLibres = document.querySelectorAll(
    ".mesa-plano.libre"
);

// Obtener los elementos del HTML
const detalle = document.getElementById("detalle-mesa");
const titulo = document.getElementById("titulo-mesa");
const capacidad = document.getElementById("capacidad-mesa");
const enlace = document.getElementById("enlace-reserva");

// Recorrer las mesas disponibles
mesasLibres.forEach(function(mesa) {

    mesa.addEventListener("click", function() {

        // Quitar la selección anterior
        mesasLibres.forEach(function(otraMesa) {
            otraMesa.classList.remove("seleccionada");
        });

        // Marcar la mesa seleccionada
        mesa.classList.add("seleccionada");

        // Obtener el número y capacidad de la mesa
        const numero = mesa.dataset.mesa;
        const personas = mesa.dataset.capacidad;

        // Mostrar información de la mesa
        titulo.textContent = "Mesa " + numero;

        capacidad.textContent =
            "Capacidad: " + personas + " personas";

        // Guardar temporalmente la mesa elegida
        // Esto NO representa una sesión de usuario
        sessionStorage.setItem(
            "mesaSeleccionada",
            numero
        );

        // Enviar al cliente a la pantalla
        // de registro o inicio de sesión
        enlace.href =
            "acceso-reserva.html?mesa=" +
            encodeURIComponent(numero);

        // Mostrar los detalles
        detalle.hidden = false;

    });

});
