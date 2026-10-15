
/* =====================================
   RESTAURANTE RATATOULLI
   FORMULARIO DE RESERVACIONES
   ===================================== */

// DATOS DE EJEMPLO DE LAS MESAS

const mesas = {
    1: { capacidad: 2, ubicacion: "Interior" },
    2: { capacidad: 4, ubicacion: "Interior" },
    3: { capacidad: 6, ubicacion: "Interior" },
    4: { capacidad: 4, ubicacion: "Terraza" },
    5: { capacidad: 2, ubicacion: "Terraza" },
    6: { capacidad: 8, ubicacion: "Terraza" }
};

// Mesas disponibles en el plano de ejemplo
const mesasDisponibles = ["1", "3", "5", "6"];

// OBTENER ELEMENTOS DEL HTML

const infoMesa = document.getElementById("info-mesa");
const formulario = document.getElementById("form-reserva");
const personas = document.getElementById("personas");
const fecha = document.getElementById("fecha");
const mensaje = document.getElementById("mensaje-reserva");

const enlaceAcceso = document.getElementById(
    "enlace-acceso-reserva"
);

// OBTENER LA MESA SELECCIONADA

const parametros = new URLSearchParams(
    window.location.search
);

let numeroMesa = parametros.get("mesa");

// Si no aparece en la URL,
// recuperar la mesa guardada temporalmente
if (!numeroMesa) {
    numeroMesa = sessionStorage.getItem(
        "mesaSeleccionada"
    );
}

// VALIDAR MESA

const mesaValida =
    mesasDisponibles.includes(numeroMesa);

// FECHA LOCAL

function fechaLocal(date) {

    const anio = date.getFullYear();

    const mes = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        date.getDate()
    ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

// Establecer fecha mínima
fecha.min = fechaLocal(new Date());

// MOSTRAR INFORMACIÓN DE LA MESA

if (!mesaValida) {

    infoMesa.textContent =
        "Primero selecciona una mesa disponible desde el plano.";

    formulario.hidden = true;

    mensaje.textContent =
        "Selecciona una mesa para continuar.";

    mensaje.style.color = "red";

} else {

    const mesa = mesas[numeroMesa];

    // Conservar selección
    sessionStorage.setItem(
        "mesaSeleccionada",
        numeroMesa
    );

    infoMesa.textContent =
        `Mesa ${numeroMesa} | ${mesa.ubicacion} |
        Capacidad: ${mesa.capacidad} personas`;

    personas.max = mesa.capacidad;

    // Conservar la mesa en el enlace de acceso
    if (enlaceAcceso) {

        enlaceAcceso.href =
            "acceso-reserva.html?mesa=" +
            encodeURIComponent(numeroMesa);
    }

}

// =====================================
// VALIDAR FORMULARIO DE RESERVACIÓN
// =====================================

formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    mensaje.textContent = "";
    mensaje.style.color = "red";

    if (!mesaValida) {
        mensaje.textContent =
            "Selecciona primero una mesa disponible.";
        return;
    }

    const cantidad = Number(personas.value);

    const capacidad = mesas[numeroMesa].capacidad;

    const hora = document.getElementById(
        "hora"
    ).value;

    const preferencia = document.getElementById(
        "preferencia"
    ).value.trim();

    // VALIDAR CANTIDAD DE PERSONAS

    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > capacidad
    ) {

        mensaje.textContent =
            `La Mesa ${numeroMesa} admite entre
            1 y ${capacidad} personas.`;

        return;
    }

    // VALIDAR FECHA Y HORA

    if (!fecha.value || !hora) {

        mensaje.textContent =
            "Selecciona una fecha y una hora.";

        return;
    }

    const fechaHora = new Date(
        `${fecha.value}T${hora}:00`
    );

    if (
        Number.isNaN(fechaHora.getTime()) ||
        fechaHora <= new Date()
    ) {

        mensaje.textContent =
            "Selecciona una fecha y hora futuras.";

        return;
    }

    // =====================================
    // VALIDACIÓN COMPLETADA
    // =====================================

    // El formulario solo comprueba los datos.
    // Todavía no existe autenticación real.
    //
    // El backend deberá comprobar:
    // - Que el cliente haya iniciado sesión.
    // - Que la mesa esté disponible.
    // - Que la fecha y hora sean válidas.
    // - Que se pueda registrar la reservación.

    mensaje.style.color = "green";

    mensaje.textContent =
        `Los datos para la Mesa ${numeroMesa}
        son válidos. Todavía no se ha creado
        ninguna reservación. Debes iniciar sesión
        cuando el backend esté conectado.`;

    // No guardamos una reserva confirmada.
    // No redirigimos a confirmacion.html.
    // No concedemos acceso mediante sessionStorage.

});
