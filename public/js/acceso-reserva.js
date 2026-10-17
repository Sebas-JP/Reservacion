
/* =====================================
   RESTAURANTE RATATOULLI
   ACCESO PREVIO A LA RESERVACIÓN
   ===================================== */

// Obtener los parámetros de la dirección
const parametros = new URLSearchParams(
    window.location.search
);

// Buscar el número de mesa
let numeroMesa = parametros.get("mesa");

// Si no viene en la dirección, buscar
// la mesa guardada temporalmente
if (!numeroMesa) {
    numeroMesa = sessionStorage.getItem(
        "mesaSeleccionada"
    );
}

// Elementos del HTML
const informacionMesa = document.getElementById(
    "informacion-mesa"
);

const textoMesa = document.getElementById(
    "mesa-seleccionada"
);

const enlaceLogin = document.getElementById(
    "enlace-login"
);

const enlaceRegistro = document.getElementById(
    "enlace-registro"
);

// Solo aceptar los números de las mesas
// disponibles en nuestro plano de ejemplo
const mesasValidas = ["1", "3", "5", "6"];

if (mesasValidas.includes(numeroMesa)) {

    // Conservar la selección
    sessionStorage.setItem(
        "mesaSeleccionada",
        numeroMesa
    );

    // Mostrar la mesa seleccionada
    textoMesa.textContent =
        "Has seleccionado la Mesa " + numeroMesa;

    informacionMesa.hidden = false;

    // Conservar la mesa en los enlaces
    enlaceLogin.href =
        "login.html?mesa=" +
        encodeURIComponent(numeroMesa);

    enlaceRegistro.href =
        "registro.html?mesa=" +
        encodeURIComponent(numeroMesa);

} else {

    // Si no hay una mesa válida,
    // permitir el acceso normal
    sessionStorage.removeItem("mesaSeleccionada");

    enlaceLogin.href = "login.html";
    enlaceRegistro.href = "registro.html";

}
