
/* =====================================
   RESTAURANTE RATATOULLI
   CONFIRMACIÓN DE RESERVACIONES
   ===================================== */

// OBTENER ELEMENTOS DEL HTML

const contenedor = document.getElementById(
    "datos-confirmacion"
);

const mensaje = document.getElementById(
    "mensaje-confirmacion"
);

// OCULTAR LOS DATOS DE CONFIRMACIÓN

contenedor.hidden = true;

// ELIMINAR DATOS ANTIGUOS DE DEMOSTRACIÓN

// Antes se guardaban reservaciones de prueba
// en sessionStorage.
//
// Ya no utilizaremos esos datos para
// mostrar reservaciones confirmadas.

sessionStorage.removeItem("reservaTemporal");

// MOSTRAR ESTADO ACTUAL

mensaje.textContent =
    "Todavía no hay una reservación confirmada. " +
    "Cuando se conecte el backend, aquí podrás " +
    "consultar los detalles de tu reservación.";

mensaje.style.color = "#4d6255";

// =====================================
// INTEGRACIÓN FUTURA CON EL BACKEND
// =====================================

// Cuando el backend esté conectado:
//
// 1. El servidor verificará la sesión del cliente.
//
// 2. Comprobará que la mesa esté disponible.
//
// 3. Guardará la reservación en la base de datos.
//
// 4. Generará un código de reservación real.
//
// 5. Devolverá los datos confirmados.
//
// 6. Esta página mostrará esos datos.
//
// IMPORTANTE:
// No debemos generar códigos de reservación
// desde el navegador ni considerar que
// sessionStorage demuestra una reserva real.
