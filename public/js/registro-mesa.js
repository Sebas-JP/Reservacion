
/* =====================================
   RESTAURANTE RATATOULLI
   CONSERVAR MESA DURANTE EL REGISTRO
   ===================================== */

// Obtener la mesa de la dirección
const parametrosRegistroMesa = new URLSearchParams(
    window.location.search
);

let mesaPendienteRegistro = parametrosRegistroMesa.get(
    "mesa"
);

// Si no viene en la URL,
// buscarla en el almacenamiento temporal
if (!mesaPendienteRegistro) {
    mesaPendienteRegistro = sessionStorage.getItem(
        "mesaSeleccionada"
    );
}

// Mesas disponibles en nuestro ejemplo
const mesasValidasRegistro = ["1", "3", "5", "6"];

// Obtener elementos del HTML
const avisoMesaRegistro = document.getElementById(
    "aviso-mesa-registro"
);

const textoMesaRegistro = document.getElementById(
    "texto-mesa-registro"
);

const enlaceLoginRegistro = document.getElementById(
    "enlace-login-registro"
);

// Verificar que la mesa sea válida
if (mesasValidasRegistro.includes(mesaPendienteRegistro)) {

    // Guardar la selección temporalmente
    sessionStorage.setItem(
        "mesaSeleccionada",
        mesaPendienteRegistro
    );

    // Mostrar la mesa elegida
    textoMesaRegistro.textContent =
        "Has seleccionado la Mesa " +
        mesaPendienteRegistro + ".";

    avisoMesaRegistro.hidden = false;

    // Conservar la mesa al pasar al login
    enlaceLoginRegistro.href =
        "login.html?mesa=" +
        encodeURIComponent(mesaPendienteRegistro);

} else {

    // Si no existe una mesa válida
    avisoMesaRegistro.hidden = true;

    enlaceLoginRegistro.href = "login.html";

}
