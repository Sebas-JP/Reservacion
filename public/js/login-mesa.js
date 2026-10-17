
/* =====================================
   RESTAURANTE RATATOULLI
   CONSERVAR MESA EN LOGIN
   ===================================== */

// Obtener la mesa desde la URL
const parametrosLoginMesa = new URLSearchParams(
    window.location.search
);

let mesaPendienteLogin = parametrosLoginMesa.get("mesa");

// Si no viene en la URL, buscarla
// en el almacenamiento temporal
if (!mesaPendienteLogin) {
    mesaPendienteLogin = sessionStorage.getItem(
        "mesaSeleccionada"
    );
}

// Mesas disponibles del ejemplo
const mesasValidasLogin = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// Elementos de la página
const avisoMesaLogin = document.getElementById(
    "aviso-mesa-login"
);

const textoMesaLogin = document.getElementById(
    "texto-mesa-login"
);

const enlaceRegistroLogin = document.getElementById(
    "enlace-registro-login"
);

if (mesasValidasLogin.includes(mesaPendienteLogin)) {

    // Conservar la selección
    sessionStorage.setItem(
        "mesaSeleccionada",
        mesaPendienteLogin
    );

    // Mostrar el aviso
    textoMesaLogin.textContent =
        "Has seleccionado la Mesa " +
        mesaPendienteLogin + ".";

    avisoMesaLogin.hidden = false;

    // Conservar la mesa al ir a registro
    enlaceRegistroLogin.href =
        "registro.html?mesa=" +
        encodeURIComponent(mesaPendienteLogin);

} else {

    // Sin selección válida
    avisoMesaLogin.hidden = true;
    enlaceRegistroLogin.href = "registro.html";

}
